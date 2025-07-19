// استيراد مكتبات Firebase (إصدار 10.12.5)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// جديد: استيراد مكتبات Firebase Storage

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"; // أضفنا deleteObject للحذف

// **إعدادات Firebase الخاصة بمشروعك "aman-safety"**

// تأكد من أن هذه الإعدادات صحيحة لمشروعك على Firebase

const firebaseConfig = {

  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",

  authDomain: "aman-safety.firebaseapp.com",

  projectId: "aman-safety",

  storageBucket: "aman-safety.firebasestorage.app",

  messagingSenderId: "168805958858",

  appId: "1:168805958858:web:bccc84abcf58a180132033",

  measurementId: "G-N6DDZ6N7GW"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

// جديد: تهيئة Firebase Storage

const storage = getStorage(app);

let currentUserId = null;

let isDarkMode = false;

let editingProductId = null;

let selectedImageFile = null; // جديد: لتخزين ملف الصورة المختار

let currentProductImageRef = null; // جديد: لتخزين مرجع الصورة الحالية عند التعديل للحذف لاحقاً

// عناصر DOM (تم الإعلان عنها هنا)

let modeToggleButton;

let modeToggleIcon;

let userIdDisplay;

let universalModal;

let modalTitle;

let modalContent;

let modalActions;

let loadingIndicator;

let productDetailsModal;

let productDetailsTitle;

let productDetailsImage;

let productDetailsDescription;

let productDetailsPrice;

let productDetailsRating;

// جديد: عنصر تفاصيل التصنيف في المودال

let productDetailsCategory; // عنصر جديد لعرض التصنيف في مودال التفاصيل

let productForm;

let formTitle;

let productNameInput;

let productDescriptionInput;

let productPriceInput;

// تم حذف productImageInput القديم هنا

// جديد: حقول التصنيف والصورة الجديدة

let productCategoryInput; // حقل SELECT للتصنيف

let productImageInput; // حقل <input type="file"> الجديد

let imagePreviewContainer; // حاوية لمعاينة الصورة واسم الملف

let imagePreview; // عنصر <img> لمعاينة الصورة

let imageFileName; // عنصر <p> لعرض اسم الملف

let productRatingInput;

let submitButton;

let cancelEditButton;

let productsList;

let noProductsMessage;

// عناصر DOM للقائمة المنسدلة

let menuDropdownButton;

let menuDropdown;

let menuDropdownIcon;

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

        // أضفنا أنماط افتراضية إذا لم يتم تحديد className

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

    productDetailsCategory.textContent = `التصنيف: ${product.category || 'غير محدد'}`; // عرض التصنيف الجديد

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

    // تحقق من وجود العناصر قبل تطبيق الثيم

    if (!document.body || !modeToggleIcon || !menuDropdownIcon) {

        // قد لا تكون بقية العناصر قد حملت بعد، ولكن هذه أساسية لتطبيق الثيم

        console.warn("Critical header elements not found for theme application. Retrying in 50ms.");

        setTimeout(applyTheme, 50);

        return;

    }

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    // تحديث لون أيقونات الهيدر بشكل مباشر بناءً على الوضع

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');

    headerIcons.forEach(icon => {

        if (!icon) return; // التأكد أن العنصر موجود قبل التعديل

        // لا تغير لون أيقونة تبديل الوضع هنا لأنها تتغير بواسطة JS

        if (icon.id !== 'modeToggleIcon') {

            if (isDarkMode) {

                icon.style.color = 'var(--light-red)';

            } else {

                icon.style.color = 'var(--primary-red)';

            }

        }

    });

    // تحديث ألوان عناصر القائمة المنسدلة عند تبديل الثيم

    const dropdownItems = document.querySelectorAll('#menuDropdown a .material-symbols-outlined');

     dropdownItems.forEach(icon => {

        if (!icon) return; // التأكد أن العنصر موجود قبل التعديل

        if (isDarkMode) {

            icon.style.color = 'var(--light-red)';

        } else {

            icon.style.color = 'var(--primary-red)';

        }

    });

}

// جديد: دالة لرفع الصورة إلى Firebase Storage

async function uploadImageToStorage(file) {

    if (!file || !currentUserId) {

        console.warn("No file selected or user not authenticated for image upload.");

        return null;

    }

    // إنشاء مسار فريد للصورة لتجنب التكرار

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

// جديد: دالة لحذف الصورة من Firebase Storage

async function deleteImageFromStorage(imageUrl) {

    if (!imageUrl) return;

    try {

        // إنشاء مرجع التخزين من URL

        const imageRef = ref(storage, imageUrl);

        await deleteObject(imageRef);

        console.log("Image deleted successfully:", imageUrl);

    } catch (error) {

        // تجاهل الخطأ إذا كانت الصورة غير موجودة (مثلاً، إذا كان المسار خاطئًا أو تم حذفها يدويًا)

        if (error.code === 'storage/object-not-found') {

            console.warn("Image not found in storage, skipping deletion:", imageUrl);

        } else {

            console.error("Error deleting image:", error);

            // يمكنك اختيار عرض رسالة خطأ للمستخدم هنا إذا كان الخطأ حرجًا

        }

    }

}

// Functions for product management (add, edit, delete, render)

async function addProduct(product) {

    try {

        const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

        await addDoc(productsCollectionRef, product);

        openModal('نجاح', 'تمت إضافة المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        productForm.reset();

        selectedImageFile = null; // مسح الملف المختار

        resetImagePreview(); // مسح معاينة الصورة

    } catch (e) {

        console.error("خطأ في إضافة المنتج: ", e);

        openModal('خطأ', `فشل إضافة المنتج: ${e.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

    }

}

async function updateProduct(productId, product) {

    try {

        const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);

        // إذا تم اختيار صورة جديدة، قم برفعها وحذف الصورة القديمة

        if (selectedImageFile) {

            // قم برفع الصورة الجديدة

            const newImageUrl = await uploadImageToStorage(selectedImageFile);

            product.image = newImageUrl;

            // إذا كان هناك صورة قديمة، احذفها

            if (currentProductImageRef) {

                await deleteImageFromStorage(currentProductImageRef);

            }

        } else if (!selectedImageFile && product.image === null && currentProductImageRef) {

            // إذا قام المستخدم بمسح الصورة (ولم يرفع جديدة) وكانت هناك صورة قديمة

            // هذا الشرط يتم تفعيله عندما يكون currentProductImageRef موجودًا

            // ولكن product.image أصبح null (مما يعني أن المستخدم أزال الصورة من النموذج)

            // و selectedImageFile هو null (يعني لم يرفع صورة جديدة)

            await deleteImageFromStorage(currentProductImageRef);

        }

        await updateDoc(productDocRef, product);

        openModal('نجاح', 'تم تحديث المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        productForm.reset();

        submitButton.textContent = 'إضافة منتج';

        cancelEditButton.classList.add('hidden');

        formTitle.textContent = 'إضافة منتج جديد';

        editingProductId = null;

        selectedImageFile = null; // مسح الملف المختار

        currentProductImageRef = null; // مسح مرجع الصورة القديمة

        resetImagePreview(); // مسح معاينة الصورة

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

                 loading="lazy"> <div class="product-item-actions">

                <button data-id="${product.id}" class="exit-app-btn" title="طلب الخدمة">

                    <span class="material-symbols-outlined">exit_to_app</span>

                </button>

            </div>

            <div class="product-item-content">

                <h4>${product.name}</h4>

                <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">التصنيف: ${product.category || 'غير محدد'}</p> <p>${product.description}</p>

                <p class="font-bold mt-1" style="color: var(--primary-red);">${product.price} ريال</p>

                <span class="text-yellow-600 text-sm">${product.rating} <span class="material-symbols-outlined text-sm align-middle">star</span></span>

            </div>

            <div class="flex justify-around p-4 border-t border-gray-200 dark:border-gray-700">

                <button data-id="${product.id}" class="view-details-btn text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full transition-colors duration-200" title="عرض التفاصيل">

                    <span class="material-symbols-outlined">info</span>

                </button>

                <button data-id="${product.id}" class="edit-btn text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 p-2 rounded-full transition-colors duration-200" title="تعديل">

                    <span class="material-symbols-outlined">edit</span>

                </button>

                <button data-id="${product.id}" class="delete-btn text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full transition-colors duration-200" title="حذف">

                    <span class="material-symbols-outlined">delete</span>

                </button>

            </div>

        `;

        productsList.appendChild(productItem);

    });

    // إضافة معالجات الأحداث لأزرار التعديل والحذف وعرض التفاصيل

    document.querySelectorAll('.view-details-btn').forEach(button => {

        button.addEventListener('click', (e) => {

            const productId = e.currentTarget.dataset.id;

            const productToShow = products.find(p => p.id === productId);

            if (productToShow) {

                openProductDetailsModal(productToShow);

            }

        });

    });

    // جديد: معالج لزر exit_to_app

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

                productCategoryInput.value = productToEdit.category || ''; // تعبئة حقل التصنيف

                // جديد: التعامل مع الصورة عند التعديل

                currentProductImageRef = productToEdit.image; // حفظ مرجع الصورة القديمة

                if (productToEdit.image) {

                    imagePreview.src = productToEdit.image;

                    // لا يمكن لحقل type="file" أن يعرض مسار ملف من الجهاز

                    // لذلك سنعرض "صورة موجودة" كاسم ملف

                    imageFileName.textContent = "صورة موجودة (لن تتغير إلا إذا اخترت ملفًا جديدًا)";

                    imagePreviewContainer.classList.remove('hidden');

                } else {

                    resetImagePreview();

                }

                selectedImageFile = null; // تأكد من عدم وجود ملف محدد مسبقاً

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

            const productToDelete = products.find(p => p.id === productIdToDelete); // للحصول على رابط الصورة

            confirmDeleteProduct(productIdToDelete, productToDelete ? productToDelete.image : null);

        });

    });

}

// جديد: دالة لمسح معاينة الصورة

function resetImagePreview() {

    imagePreview.src = '#';

    imagePreview.alt = "معاينة الصورة";

    imageFileName.textContent = '';

    imagePreviewContainer.classList.add('hidden');

    productImageInput.value = ''; // مسح اختيار الملف من الحقل

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

                    // حذف الصورة من Storage أولاً إذا كانت موجودة

                    if (imageUrlToDelete) {

                        await deleteImageFromStorage(imageUrlToDelete);

                    }

                    // ثم حذف المستند من Firestore

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

// DOMContentLoaded Listener

document.addEventListener('DOMContentLoaded', () => {

    // **Assign DOM elements here (Crucial for proper functioning)**

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

    productDetailsCategory = document.getElementById('productDetailsCategory'); // تعيين العنصر الجديد هنا

    productForm = document.getElementById('productForm');

    formTitle = document.querySelector('#productFormSection h3');

    productNameInput = document.getElementById('productName');

    productDescriptionInput = document.getElementById('productDescription');

    productPriceInput = document.getElementById('productPrice');

    // تم حذف تعيين productImageInput القديم هنا

    // جديد: تعيين عناصر التصنيف والصورة

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

    // Initial theme application

    const storedDarkMode = localStorage.getItem('darkMode');

    if (storedDarkMode === 'true') {

        isDarkMode = true;

    }

    applyTheme(); // Call applyTheme after all elements are assigned

    // Event Listeners for Modals (to close when clicking outside)

    if (universalModal) {

        universalModal.addEventListener('click', (e) => {

            if (e.target === universalModal) {

                closeModal();

            }

        });

    }

    if (productDetailsModal) {

        productDetailsModal.addEventListener('click', (e) => {

            if (e.target === productDetailsModal) {

                closeProductDetailsModal();

            }

        });

    }

    // Event Listeners for Header Icons

    if (modeToggleButton) {

        modeToggleButton.addEventListener('click', toggleDarkMode);

    }

    // Toggle Dropdown Menu and change icon

    if (menuDropdownButton && menuDropdown && menuDropdownIcon) {

        menuDropdownButton.addEventListener('click', (event) => {

            event.stopPropagation();

            const isShowing = menuDropdown.classList.toggle('show');

            menuDropdownIcon.textContent = isShowing ? 'arrow_drop_up' : 'arrow_drop_down';

        });

        // Close Dropdown Menu when clicking outside

        document.addEventListener('click', (event) => {

            if (menuDropdown && menuDropdownButton && !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {

                menuDropdown.classList.remove('show');

                menuDropdownIcon.textContent = 'arrow_drop_down';

            }

        });

    }

    // Handle the new "Manage Account" link

    const manageAccountLink = document.getElementById('manageAccountLink');

    if (manageAccountLink) {

        manageAccountLink.addEventListener('click', (e) => {

            e.preventDefault();

            closeModal();

            openModal('إدارة الحساب', 'هنا يمكنك إضافة منطق لتسجيل الدخول أو الخروج أو إدارة الملف الشخصي.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        });

    }

    // جديد: معالج حدث لمعاينة الصورة عند اختيار ملف

    if (productImageInput) {

        productImageInput.addEventListener('change', (event) => {

            const file = event.target.files[0];

            if (file) {

                selectedImageFile = file; // حفظ الملف للاستخدام لاحقاً

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

            // جديد: التأكد من اختيار تصنيف

            if (!productCategoryInput.value) {

                openModal('خطأ', 'الرجاء اختيار تصنيف للمنتج.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                return;

            }

            openModal('جاري الحفظ', 'الرجاء الانتظار...', [], true);

            let imageUrl = currentProductImageRef; // ابدأ برابط الصورة الحالي

            // إذا كان هناك ملف صورة جديد تم اختياره، قم برفعه

            if (selectedImageFile) {

                try {

                    imageUrl = await uploadImageToStorage(selectedImageFile);

                } catch (error) {

                    openModal('خطأ', `فشل رفع الصورة: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                    return; // إيقاف العملية إذا فشل رفع الصورة

                }

            } else if (!selectedImageFile && editingProductId && productImageInput.value === '' && imageUrl) {

                // هذا الشرط يعني:

                // 1. لا يوجد ملف جديد تم اختياره (selectedImageFile === null)

                // 2. نحن في وضع التعديل (editingProductId موجود)

                // 3. حقل اختيار الملف أصبح فارغاً (productImageInput.value === '')، مما يشير إلى أن المستخدم أزال الصورة

                // 4. كانت هناك صورة موجودة مسبقاً (imageUrl ليست null)

                // في هذه الحالة، نريد حذف الصورة القديمة وتعيين imageUrl إلى null في Firestore

                try {

                    await deleteImageFromStorage(imageUrl);

                    imageUrl = null;

                } catch (error) {

                    console.error("خطأ أثناء حذف الصورة القديمة عند الإزالة من الحقل:", error);

                    // يمكنك اختيار إظهار خطأ للمستخدم هنا إذا كان حرجاً

                }

            }

            const productData = {

                name: productNameInput.value,

                description: productDescriptionInput.value,

                price: parseFloat(productPriceInput.value),

                image: imageUrl, // استخدم رابط الصورة الذي تم رفعه أو الحالي

                rating: parseFloat(productRatingInput.value),

                category: productCategoryInput.value // جديد: أضف التصنيف

            };

            if (editingProductId) {

                // في حالة التعديل، updateProduct سيتعامل مع حذف الصورة القديمة إذا تم استبدالها أو إزالتها

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

            selectedImageFile = null; // مسح الملف المختار

            currentProductImageRef = null; // مسح مرجع الصورة القديمة

            resetImagePreview(); // مسح معاينة الصورة

        });

    }

    // إضافة معالجات أحداث التركيز والخروج من التركيز لحقول الإدخال

    document.querySelectorAll('.input-section input, .input-section textarea, .input-section select').forEach(inputField => { // أضفنا select

        inputField.addEventListener('focus', (event) => {

            const section = event.target.closest('.input-section');

            if (section) {

                section.classList.add('input-section-focused');

            }

        });

        inputField.addEventListener('blur', (event) => {

            const section = event.target.closest('.input-section');

            if (section) {

                section.classList.remove('input-section-focused');

            }

        });

    });

    // Firebase Auth State Listener for product management page

    onAuthStateChanged(auth, async (user) => {

        try {

            if (user) {

                currentUserId = user.uid;

                if (userIdDisplay) userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;

                // بدء الاستماع للمنتجات بعد تسجيل الدخول

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

                // إذا لم يكن هناك مستخدم مسجل دخول، حاول تسجيل الدخول كمستخدم مجهول

                try {

                    await signInAnonymously(auth);

                    // بمجرد تسجيل الدخول المجهول، سيتم تشغيل onAuthStateChanged مرة أخرى مع المستخدم الجديد.

                } catch (authError) {

                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);

                    if (userIdDisplay) userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;

                    if (productsList) productsList.innerHTML = '<p class="text-center text-red-600 text-lg">تعذر تسجيل الدخول للمتابعة.</p>';

                }

            }

        } finally {

            // لا شيء هنا

        }

    });

});