// استيراد مكتبات Firebase (إصدار 10.12.5)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// **إعدادات Firebase الخاصة بمشروعك "aman-safety"**

const firebaseConfig = {

  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",

  authDomain: "aman-safety.firebaseapp.com",

  projectId: "aman-safety",

  messagingSenderId: "16880858", // تم تصحيح هذا الرقم من 168805958858 إلى 16880858 بناءً على سياق سابق

  appId: "1:168805958858:web:bccc84abcf58a180132033",

  measurementId: "G-N6DDZ6N7GW"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

let currentUserId = null;

let isDarkMode = false;

let editingProductId = null;

let selectedImageBase64 = null; // لتخزين سلسلة Base64 للصورة المحددة

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

let productDetailsCategory;

// جديد: عنصر تفاصيل الخصم في المودال

let productDetailsDiscount; 

let productForm;

let formTitle;

let productNameInput;

let productDescriptionInput;

let productPriceInput;

let productCategoryInput; // حقل SELECT للتصنيف

let productImageInput; // حقل <input type="file">

let imagePreviewContainer;

let imagePreview;

let imageFileName;

// جديد: حقل نسبة الخصم

let productDiscountInput;

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

    if (!productDetailsModal || !productDetailsTitle || !productDetailsImage || !productDetailsDescription || !productDetailsPrice || !productDetailsRating || !productDetailsCategory || !productDetailsDiscount) {

        console.error("Product details modal elements not found. Cannot open modal.");

        return;

    }

    productDetailsTitle.textContent = product.name;

    productDetailsCategory.textContent = `التصنيف: ${product.category || 'غير محدد'}`; 

    productDetailsDescription.textContent = `الوصف: ${product.description || 'لا يوجد وصف.'}`;

    productDetailsRating.textContent = `التقييم: ${product.rating} / 5`;

    // عرض السعر والخصم

    let priceText = `${product.price} ريال`;

    if (product.discountPercentage && product.discountPercentage > 0) {

        const originalPrice = product.price;

        const discountAmount = originalPrice * (product.discountPercentage / 100);

        const discountedPrice = originalPrice - discountAmount;

        productDetailsPrice.innerHTML = `<span class="line-through text-gray-500">${originalPrice} ريال</span> <span class="text-red-600 font-bold ml-2">${discountedPrice.toFixed(2)} ريال</span>`;

        productDetailsDiscount.textContent = `خصم: ${product.discountPercentage}%`;

        productDetailsDiscount.classList.remove('hidden');

    } else {

        productDetailsPrice.textContent = `السعر: ${product.price} ريال`;

        productDetailsDiscount.classList.add('hidden');

        productDetailsDiscount.textContent = ''; // مسح المحتوى إذا لا يوجد خصم

    }

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

        console.error("Modal elements not found. Cannot close modal.");

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

        console.warn("Critical header elements not found for theme application. Retrying in 50ms.");

        setTimeout(applyTheme, 50);

        return;

    }

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');

    headerIcons.forEach(icon => {

        if (!icon) return;

        if (icon.id !== 'modeToggleIcon') {

            if (isDarkMode) {

                icon.style.color = 'var(--light-red)';

            } else {

                icon.style.color = 'var(--primary-red)';

            }

        }

    });

    const dropdownItems = document.querySelectorAll('#menuDropdown a .material-symbols-outlined');

     dropdownItems.forEach(icon => {

        if (!icon) return;

        if (isDarkMode) {

            icon.style.color = 'var(--light-red)';

        } else {

            icon.style.color = 'var(--primary-red)';

        }

    });

}

// دالة لمسح معاينة الصورة

function resetImagePreview() {

    imagePreview.src = '#';

    imagePreview.alt = "معاينة الصورة";

    imageFileName.textContent = '';

    imagePreviewContainer.classList.add('hidden');

    productImageInput.value = ''; // مسح اختيار الملف من الحقل

}

// Functions for product management (add, edit, delete, render)

async function addProduct(product) {

    try {

        const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

        await addDoc(productsCollectionRef, product);

        openModal('نجاح', 'تمت إضافة المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        productForm.reset();

        selectedImageBase64 = null; 

        resetImagePreview(); 

    } catch (e) {

        console.error("خطأ في إضافة المنتج: ", e);

        openModal('خطأ', `فشل إضافة المنتج: ${e.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

    }

}

async function updateProduct(productId, product) {

    try {

        const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);

        await updateDoc(productDocRef, product);

        openModal('نجاح', 'تم تحديث المنتج بنجاح!', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        productForm.reset();

        submitButton.textContent = 'إضافة منتج';

        cancelEditButton.classList.add('hidden');

        formTitle.textContent = 'إضافة منتج جديد';

        editingProductId = null;

        selectedImageBase64 = null; 

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

        // حساب السعر بعد الخصم والعرض

        let displayedPriceHtml = `<p class="font-bold mt-1" style="color: var(--primary-red);">${product.price} ريال</p>`;

        let discountBadgeHtml = '';

        if (product.discountPercentage && product.discountPercentage > 0) {

            const originalPrice = product.price;

            const discountAmount = originalPrice * (product.discountPercentage / 100);

            const discountedPrice = originalPrice - discountAmount;

            

            displayedPriceHtml = `

                <p class="font-bold mt-1" style="color: var(--primary-red);">

                    <span class="line-through text-gray-500 dark:text-gray-400">${originalPrice} ريال</span> 

                    <span class="text-red-600 font-bold ml-2">${discountedPrice.toFixed(2)} ريال</span>

                </p>

            `;

            discountBadgeHtml = `

                <div class="discount-badge">

                    %${product.discountPercentage} خصم

                </div>

            `;

        }

        // استخدام سلسلة Base64 مباشرة كـ src للصورة

        productItem.innerHTML = `

            ${discountBadgeHtml} <img src="${product.image || 'https://placehold.co/400x200/cccccc/000000?text=لا توجد صورة'}"

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

                ${displayedPriceHtml} <span class="text-yellow-600 text-sm">${product.rating} <span class="material-symbols-outlined text-sm align-middle">star</span></span>

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

                // جديد: تعبئة حقل نسبة الخصم

                productDiscountInput.value = productToEdit.discountPercentage || '';

                if (productToEdit.image) {

                    imagePreview.src = productToEdit.image;

                    imageFileName.textContent = "صورة موجودة (لن تتغير إلا إذا اخترت ملفًا جديدًا)";

                    imagePreviewContainer.classList.remove('hidden');

                } else {

                    resetImagePreview();

                }

                selectedImageBase64 = null; 

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

            confirmDeleteProduct(productIdToDelete);

        });

    });

}

function confirmDeleteProduct(productId) {

    openModal(

        'تأكيد الحذف',

        'هل أنت متأكد أنك تريد حذف هذا المنتج؟',

        [

            { text: 'إلغاء', className: 'bg-gray-300 text-gray-800', onClick: closeModal },

            { text: 'حذف', className: 'bg-red-500 text-white', onClick: async () => {

                closeModal();

                openModal('جاري الحذف', 'الرجاء الانتظار...', [], true);

                try {

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

    productDetailsCategory = document.getElementById('productDetailsCategory'); 

    // جديد: تعيين عنصر تفاصيل الخصم

    productDetailsDiscount = document.getElementById('productDetailsDiscount');

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

    // جديد: تعيين حقل نسبة الخصم

    productDiscountInput = document.getElementById('productDiscount');

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

    applyTheme(); 

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

    // معالج حدث لتحويل الصورة إلى Base64 عند اختيار ملف

    if (productImageInput) {

        productImageInput.addEventListener('change', (event) => {

            const file = event.target.files[0];

            if (file) {

                imageFileName.textContent = file.name;

                const reader = new FileReader();

                reader.onload = (e) => {

                    selectedImageBase64 = e.target.result; // تخزين سلسلة Base64

                    imagePreview.src = selectedImageBase64;

                    imagePreviewContainer.classList.remove('hidden');

                };

                reader.readAsDataURL(file); // قراءة الملف كـ Data URL (Base64)

            } else {

                selectedImageBase64 = null;

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

            let imageToSave = selectedImageBase64;

            // إذا لم يتم اختيار صورة جديدة ولكن كانت هناك صورة سابقة في وضع التعديل وتم مسح الحقل

            if (!selectedImageBase64 && editingProductId && productImageInput.value === '') {

                // للتحقق مما إذا كان هناك صورة سابقة في المنتج بالفعل

                const productToEditSnapshot = await doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, editingProductId).get();

                if (productToEditSnapshot.exists()) {

                    const existingProductData = productToEditSnapshot.data();

                    if (existingProductData.image && !productImageInput.files.length) {

                         imageToSave = null; 

                    }

                }

            }

            const productData = {

                name: productNameInput.value,

                description: productDescriptionInput.value,

                price: parseFloat(productPriceInput.value),

                image: imageToSave, 

                rating: parseFloat(productRatingInput.value),

                category: productCategoryInput.value,

                // جديد: إضافة نسبة الخصم (تحويلها إلى رقم)

                discountPercentage: parseFloat(productDiscountInput.value) || 0 

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

            selectedImageBase64 = null; 

            resetImagePreview(); 

        });

    }

    document.querySelectorAll('.input-section input, .input-section textarea, .input-section select').forEach(inputField => { 

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

        } finally {

            // لا شيء هنا

        }

    });

}); 