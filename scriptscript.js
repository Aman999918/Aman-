// استيراد مكتبات Firebase (إصدار 10.12.5)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"; // أضفنا deleteObject للحذف

// **إعدادات Firebase الخاصة بمشروعك "aman-safety"**

// تأكد من أن هذه الإعدادات صحيحة لمشروعك على Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",
  authDomain: "aman-safety.firebaseapp.com",
  projectId: "aman-safety",
  storageBucket: "aman-safety.appspot.com",
  messagingSenderId: "168805958858",
  appId: "1:168805958858:web:bccc84abcf58a180132033",
  measurementId: "G-N6DDZ6N7GW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

let currentUserId = null;
let isDarkMode = false;
let editingProductId = null;
let selectedImageFile = null; // جديد: لتخزين ملف الصورة المختار
let currentProductImageRef = null; // جديد: لتخزين مرجع الصورة الحالية عند التعديل للحذف لاحقاً

// عناصر DOM
let modeToggleButton, modeToggleIcon, userIdDisplay, universalModal, modalTitle, modalContent, modalActions, loadingIndicator;
let productDetailsModal, productDetailsTitle, productDetailsImage, productDetailsDescription, productDetailsPrice, productDetailsRating, productDetailsCategory;
let productForm, formTitle, productNameInput, productDescriptionInput, productPriceInput, productCategoryInput, productImageInput, imagePreviewContainer, imagePreview, imageFileName, productRatingInput, submitButton, cancelEditButton, productsList, noProductsMessage;
let menuDropdownButton, menuDropdown, menuDropdownIcon;

// دوال النافذة المنبثقة العامة (Universal Modal)
function openModal(title, message, buttons = [], is_loading = false) {
    if (!modalTitle || !modalContent || !modalActions || !loadingIndicator || !universalModal) {
        console.error("Modal elements not found. Cannot open modal.");
        return;
    }
    modalTitle.textContent = title;
    modalContent.innerHTML = message;
    modalActions.innerHTML = '';
    buttons.forEach(btn => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = btn.text;
        buttonElement.className = `py-2 px-4 rounded font-bold ${btn.className || 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`;
        buttonElement.onclick = () => { btn.onClick(); };
        modalActions.appendChild(buttonElement);
    });
    if (is_loading) {
        loadingIndicator.classList.remove('hidden');
        modalActions.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
        modalActions.classList.remove('hidden');
    }
    universalModal.classList.add('active');
    document.body.classList.add('no-scroll');
}
function closeModal() {
    if (!universalModal || !modalTitle || !modalContent || !modalActions || !loadingIndicator) {
        console.error("Modal elements not found. Cannot close modal.");
        return;
    }
    universalModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    modalTitle.textContent = '';
    modalContent.innerHTML = '';
    modalActions.innerHTML = '';
    loadingIndicator.classList.add('hidden');
}

// دوال النافذة المنبثقة لتفاصيل المنتج (Product Details Modal)
function openProductDetailsModal(product) {
    if (!productDetailsModal || !productDetailsTitle || !productDetailsImage || !productDetailsDescription || !productDetailsPrice || !productDetailsRating || !productDetailsCategory) {
        console.error("Product details modal elements not found. Cannot open modal.");
        return;
    }
    productDetailsTitle.textContent = product.name;
    productDetailsCategory.textContent = `التصنيف: ${product.category || 'غير محدد'}`;
    productDetailsDescription.textContent = `الوصف: ${product.description || 'لا يوجد وصف.'}`;
    productDetailsPrice.textContent = `السعر: ${product.price} ريال`;
    productDetailsRating.textContent = `التقييم: ${product.rating} / 5`;
    if (product.image) {
        productDetailsImage.src = product.image;
        productDetailsImage.classList.remove('hidden');
    } else {
        productDetailsImage.classList.add('hidden');
        productDetailsImage.src = '';
    }
    productDetailsModal.classList.add('active');
    document.body.classList.add('no-scroll');
}
function closeProductDetailsModal() {
    if (!productDetailsModal) {
        console.error("Product details modal element not found. Cannot close modal.");
        return;
    }
    productDetailsModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// دوال الثيم (الوضع الليلي/النهاري)
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
}
function applyTheme() {
    if (!document.body || !modeToggleIcon || !menuDropdownIcon) {
        setTimeout(applyTheme, 50);
        return;
    }
    document.body.classList.toggle('dark-mode', isDarkMode);
    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';
    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');
    headerIcons.forEach(icon => {
        if (!icon) return;
        if (icon.id !== 'modeToggleIcon') {
            icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';
        }
    });
    const dropdownItems = document.querySelectorAll('#menuDropdown a .material-symbols-outlined');
    dropdownItems.forEach(icon => {
        if (!icon) return;
        icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';
    });
}

// رفع الصورة إلى Firebase Storage
async function uploadImageToStorage(file) {
    if (!file || !currentUserId) {
        console.warn("No file selected or user not authenticated for image upload.");
        return null;
    }
    const storageRef = ref(storage, `users/${currentUserId}/product_images/${file.name}_${Date.now()}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Image uploaded successfully:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("فشل في رفع الصورة: " + error.message);
    }
}

// حذف الصورة من Firebase Storage
async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return;
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        console.log("Image deleted successfully:", imageUrl);
    } catch (error) {
        if (error.code === 'storage/object-not-found') {
            console.warn("Image not found in storage, skipping deletion:", imageUrl);
        } else {
            console.error("Error deleting image:", error);
        }
    }
}

// إدارة المنتجات
async function addProduct(product) {
    try {
        const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);
        await addDoc(productsCollectionRef, product);
        openModal('نجاح', 'تمت إضافة المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
        productForm.reset();
        selectedImageFile = null;
        resetImagePreview();
    } catch (e) {
        console.error("خطأ في إضافة المنتج: ", e);
        openModal('خطأ', `فشل إضافة المنتج: ${e.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
    }
}
async function updateProduct(productId, product) {
    try {
        const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);
        if (selectedImageFile) {
            const newImageUrl = await uploadImageToStorage(selectedImageFile);
            product.image = newImageUrl;
            if (currentProductImageRef) {
                await deleteImageFromStorage(currentProductImageRef);
            }
        } else if (!selectedImageFile && product.image === null && currentProductImageRef) {
            await deleteImageFromStorage(currentProductImageRef);
        }
        await updateDoc(productDocRef, product);
        openModal('نجاح', 'تم تحديث المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
        productForm.reset();
        submitButton.textContent = 'إضافة منتج';
        cancelEditButton.classList.add('hidden');
        formTitle.textContent = 'إضافة منتج جديد';
        editingProductId = null;
        selectedImageFile = null;
        currentProductImageRef = null;
        resetImagePreview();
    } catch (e) {
        console.error("خطأ في تحديث المنتج: ", e);
        openModal('خطأ', `فشل تحديث المنتج: ${e.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
    }
}
function renderProductsList(products) {
    productsList.innerHTML = '';
    if (products.length === 0) {
        noProductsMessage.classList.remove('hidden');
        return;
    }
    noProductsMessage.classList.add('hidden');
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = `product-item relative`;
        productItem.innerHTML = `
            <img src="${product.image || 'https://placehold.co/400x200/cccccc/000000?text=لا توجد صورة'}"
                 alt="${product.name}"
                 onerror="this.onerror=null;this.src='https://placehold.co/400x200/cccccc/000000?text=فشل تحميل الصورة';"
                 loading="lazy">
            <div class="product-item-actions">
                <button data-id="${product.id}" class="exit-app-btn" title="طلب الخدمة">
                    <span class="material-symbols-outlined">exit_to_app</span>
                </button>
            </div>
            <div class="product-item-content">
                <h4>${product.name}</h4>
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">التصنيف: ${product.category || 'غير محدد'}</p>
                <p>${product.description}</p>
                <p class="font-bold mt-1" style="color: var(--primary-red);">${product.price} ريال</p>
                <span class="text-yellow-600 text-sm">${product.rating} <span class="material-symbols-outlined text-sm align-middle">star</span></span>
            </div>
            <div class="flex justify-around p-4 border-t border-gray-200 dark:border-gray-700">
                <button data-id="${product.id}" class="view-details-btn text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full transition-colors duration-200" title="تفاصيل المنتج">
                    <span class="material-symbols-outlined">info</span>
                </button>
                <button data-id="${product.id}" class="edit-btn text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 p-2 rounded-full transition-colors duration-200" title="تعديل المنتج">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button data-id="${product.id}" class="delete-btn text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full transition-colors duration-200" title="حذف المنتج">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
        productsList.appendChild(productItem);
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            const productToShow = products.find(p => p.id === productId);
            if (productToShow) {
                openProductDetailsModal(productToShow);
            }
        });
    });
    document.querySelectorAll('.exit-app-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            const productToActOn = products.find(p => p.id === productId);
            if (productToActOn) {
                openModal('طلب خدمة', `تم النقر على أيقونة طلب الخدمة للمنتج: ${productToActOn.name}.`, [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
            }
        });
    });
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                editingProductId = productId;
                formTitle.textContent = `تعديل منتج: ${productToEdit.name}`;
                productNameInput.value = productToEdit.name;
                productDescriptionInput.value = productToEdit.description;
                productPriceInput.value = productToEdit.price;
                productCategoryInput.value = productToEdit.category || '';
                currentProductImageRef = productToEdit.image;
                if (productToEdit.image) {
                    imagePreview.src = productToEdit.image;
                    imageFileName.textContent = "صورة موجودة (لن تتغير إلا إذا اخترت ملفًا جديدًا)";
                    imagePreviewContainer.classList.remove('hidden');
                } else {
                    resetImagePreview();
                }
                selectedImageFile = null;
                productRatingInput.value = productToEdit.rating;
                submitButton.textContent = 'حفظ التعديلات';
                cancelEditButton.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productIdToDelete = e.currentTarget.dataset.id;
            const productToDelete = products.find(p => p.id === productIdToDelete);
            confirmDeleteProduct(productIdToDelete, productToDelete ? productToDelete.image : null);
        });
    });
}

// دالة لمسح معاينة الصورة
function resetImagePreview() {
    imagePreview.src = '#';
    imagePreview.alt = "معاينة الصورة";
    imageFileName.textContent = '';
    imagePreviewContainer.classList.add('hidden');
    productImageInput.value = '';
}

function confirmDeleteProduct(productId, imageUrlToDelete) {
    openModal(
        'تأكيد الحذف',
        'هل أنت متأكد أنك تريد حذف هذا المنتج؟',
        [
            { text: 'إلغاء', className: 'bg-gray-300 text-gray-800', onClick: closeModal },
            { text: 'حذف', className: 'bg-red-500 text-white', onClick: async () => {
                closeModal();
                openModal('جاري الحذف', 'الرجاء الانتظار...', [], true);
                try {
                    if (imageUrlToDelete) {
                        await deleteImageFromStorage(imageUrlToDelete);
                    }
                    const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);
                    await deleteDoc(productDocRef);
                    openModal('نجاح', 'تم حذف المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
                } catch (error) {
                    console.error("خطأ في حذف المنتج:", error);
                    openModal('خطأ', `فشل حذف المنتج: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
                }
            }}
        ]
    );
}

// ----------- إضافة زر تشخيص اتصال فايربيس ----------
document.addEventListener('DOMContentLoaded', () => {
    // تعيين عناصر الـ DOM
    modeToggleButton = document.getElementById('modeToggleButton');
    modeToggleIcon = document.getElementById('modeToggleIcon');
    userIdDisplay = document.getElementById('userIdDisplay');
    universalModal = document.getElementById('universalModal');
    modalTitle = document.getElementById('modalTitle');
    modalContent = document.getElementById('modalContent');
    modalActions = document.getElementById('modalActions');
    loadingIndicator = document.getElementById('loadingIndicator');
    productDetailsModal = document.getElementById('productDetailsModal');
    productDetailsTitle = document.getElementById('productDetailsTitle');
    productDetailsImage = document.getElementById('productDetailsImage');
    productDetailsDescription = document.getElementById('productDetailsDescription');
    productDetailsPrice = document.getElementById('productDetailsPrice');
    productDetailsRating = document.getElementById('productDetailsRating');
    productDetailsCategory = document.getElementById('productDetailsCategory');
    productForm = document.getElementById('productForm');
    formTitle = document.querySelector('#productFormSection h3');
    productNameInput = document.getElementById('productName');
    productDescriptionInput = document.getElementById('productDescription');
    productPriceInput = document.getElementById('productPrice');
    productCategoryInput = document.getElementById('productCategory');
    productImageInput = document.getElementById('productImageInput');
    imagePreviewContainer = document.getElementById('imagePreviewContainer');
    imagePreview = document.getElementById('imagePreview');
    imageFileName = document.getElementById('imageFileName');
    productRatingInput = document.getElementById('productRating');
    submitButton = document.getElementById('submitButton');
    cancelEditButton = document.getElementById('cancelEditButton');
    productsList = document.getElementById('productsList');
    noProductsMessage = document.getElementById('noProductsMessage');
    menuDropdownButton = document.getElementById('menuDropdownButton');
    menuDropdown = document.getElementById('menuDropdown');
    menuDropdownIcon = document.getElementById('menuDropdownIcon');

    // الثيم
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true') {
        isDarkMode = true;
    }
    applyTheme();

    if (universalModal) universalModal.addEventListener('click', (e) => { if (e.target === universalModal) closeModal(); });
    if (productDetailsModal) productDetailsModal.addEventListener('click', (e) => { if (e.target === productDetailsModal) closeProductDetailsModal(); });
    if (modeToggleButton) modeToggleButton.addEventListener('click', toggleDarkMode);

    if (menuDropdownButton && menuDropdown && menuDropdownIcon) {
        menuDropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menuDropdown.classList.toggle('show');
            menuDropdownIcon.textContent = isShowing ? 'arrow_drop_up' : 'arrow_drop_down';
        });
        document.addEventListener('click', (event) => {
            if (menuDropdown && menuDropdownButton && !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {
                menuDropdown.classList.remove('show');
                menuDropdownIcon.textContent = 'arrow_drop_down';
            }
        });
    }

    const manageAccountLink = document.getElementById('manageAccountLink');
    if (manageAccountLink) {
        manageAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
            openModal('إدارة الحساب', 'هنا يمكنك إضافة منطق لتسجيل الدخول أو الخروج أو إدارة الملف الشخصي.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
        });
    }

    if (productImageInput) {
        productImageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                selectedImageFile = file;
                imageFileName.textContent = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                selectedImageFile = null;
                resetImagePreview();
            }
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!productCategoryInput.value) {
                openModal('خطأ', 'الرجاء اختيار تصنيف للمنتج.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
                return;
            }
            openModal('جاري الحفظ', 'الرجاء الانتظار...', [], true);
            let imageUrl = currentProductImageRef;
            if (selectedImageFile) {
                try {
                    imageUrl = await uploadImageToStorage(selectedImageFile);
                } catch (error) {
                    openModal('خطأ', `فشل رفع الصورة: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);
                    return;
                }
            } else if (!selectedImageFile && editingProductId && productImageInput.value === '' && imageUrl) {
                try {
                    await deleteImageFromStorage(imageUrl);
                    imageUrl = null;
                } catch (error) {
                    console.error("خطأ أثناء حذف الصورة القديمة عند الإزالة من الحقل:", error);
                }
            }
            const productData = {
                name: productNameInput.value,
                description: productDescriptionInput.value,
                price: parseFloat(productPriceInput.value),
                image: imageUrl,
                rating: parseFloat(productRatingInput.value),
                category: productCategoryInput.value
            };
            if (editingProductId) {
                await updateProduct(editingProductId, productData);
            } else {
                await addProduct(productData);
            }
        });
    }
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            editingProductId = null;
            productForm.reset();
            formTitle.textContent = 'إضافة منتج جديد';
            submitButton.textContent = 'إضافة منتج';
            cancelEditButton.classList.add('hidden');
            selectedImageFile = null;
            currentProductImageRef = null;
            resetImagePreview();
        });
    }

    document.querySelectorAll('.input-section input, .input-section textarea, .input-section select').forEach(inputField => {
        inputField.addEventListener('focus', (event) => {
            const section = event.target.closest('.input-section');
            if (section) section.classList.add('input-section-focused');
        });
        inputField.addEventListener('blur', (event) => {
            const section = event.target.closest('.input-section');
            if (section) section.classList.remove('input-section-focused');
        });
    });

    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                currentUserId = user.uid;
                if (userIdDisplay) userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;
                const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);
                const q = query(productsCollectionRef);
                onSnapshot(q, (snapshot) => {
                    const products = [];
                    snapshot.forEach(doc => {
                        products.push({ id: doc.id, ...doc.data() });
                    });
                    renderProductsList(products);
                }, (error) => {
                    console.error("خطأ في جلب المنتجات من Firestore:", error);
                });
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (authError) {
                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);
                    if (userIdDisplay) userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;
                    if (productsList) productsList.innerHTML = '<p class="text-center text-red-600 text-lg">تعذر تسجيل الدخول للمتابعة.</p>';
                }
            }
        } finally {}
    });

    // زر تشخيص الاتصال بخدمات Firebase
    let checkBtn = document.getElementById('checkFirebaseStatusBtn');
    if (!checkBtn) {
        checkBtn = document.createElement('button');
        checkBtn.id = 'checkFirebaseStatusBtn';
        checkBtn.textContent = 'تشخيص اتصال فايربيس';
        checkBtn.className = 'py-2 px-4 rounded font-bold bg-indigo-500 text-white my-2 mx-auto block';
        document.body.prepend(checkBtn);
    }
    checkBtn.addEventListener('click', async () => {
        let statusHtml = `<div style="direction:rtl;text-align:right;">`;
        statusHtml += `<h4>حالة الاتصال بخدمات Firebase:</h4><ul>`;
        // فحص الاتصال بالتوثيق (Auth)
        try {
            const user = auth.currentUser;
            if (user) {
                statusHtml += `<li>توثيق المستخدم: <span style="color:green">متصل (UID: ${user.uid})</span></li>`;
            } else {
                statusHtml += `<li>توثيق المستخدم: <span style="color:orange">لا يوجد مستخدم مسجل دخول</span></li>`;
            }
        } catch (e) {
            statusHtml += `<li>توثيق المستخدم: <span style="color:red">خطأ: ${e.message}</span></li>`;
        }
        // فحص الاتصال بقاعدة البيانات (Firestore)
        try {
            await getFirestore(app);
            const testColl = collection(db, "test_connection");
            statusHtml += `<li>قاعدة البيانات Firestore: <span style="color:green">تم التهيئة</span></li>`;
            try {
                await addDoc(testColl, { test: true, time: Date.now() });
                statusHtml += `<li>إضافة وثيقة: <span style="color:green">نجحت</span></li>`;
            } catch (e) {
                statusHtml += `<li>إضافة وثيقة: <span style="color:red">فشلت (${e.message})</span></li>`;
            }
        } catch (e) {
            statusHtml += `<li>قاعدة البيانات Firestore: <span style="color:red">خطأ: ${e.message}</span></li>`;
        }
        // فحص الاتصال بالتخزين (Storage)
        try {
            const testRef = ref(storage, 'test_connection.txt');
            const blob = new Blob(["test"], {type: "text/plain"});
            await uploadBytes(testRef, blob);
            statusHtml += `<li>تخزين الملفات Storage: <span style="color:green">نجح رفع ملف اختبار</span></li>`;
        } catch (e) {
            statusHtml += `<li>تخزين الملفات Storage: <span style="color:red">فشل رفع ملف (${e.message})</span></li>`;
        }
        statusHtml += `</ul></div>`;
        openModal("تشخيص اتصال فايربيس", statusHtml, [{text: "إغلاق", className: "bg-red-500 text-white", onClick: closeModal}]);
    });
});
