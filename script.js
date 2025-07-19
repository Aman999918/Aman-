// Import Firebase libraries (version 10.12.5)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// **Your Firebase project configuration "aman-safety"**

const firebaseConfig = {

  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",

  authDomain: "aman-safety.firebaseapp.com",

  projectId: "aman-safety",

  messagingSenderId: "16880858",

  appId: "1:168805958858:web:bccc84abcf58a180132033",

  measurementId: "G-N6DDZ6N7GW"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

let currentUserId = null;

let isDarkMode = false;

// General DOM elements

let modeToggleButton;

let modeToggleIcon;

let menuDropdownButton;

let menuDropdown;

let menuDropdownIcon;

let universalModal;

let modalTitle;

let modalContent;

let modalActions;

let loadingIndicator;

// DOM elements for product details modal

let productDetailsModal;

let productDetailsTitle;

let productDetailsImage;

let productDetailsDescription;

let productDetailsPrice;

let productDetailsRating;

let productDetailsCategory;

let productDetailsDiscount;

let productDetailsCloseButton; // متغير جديد لزر الإغلاق النصي

// DOM elements for product list section

let productsList;

let noProductsMessage;

// Universal Modal functions

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

// Product Details Modal functions

function openProductDetailsModal(product) {

    if (!productDetailsModal || !productDetailsTitle || !productDetailsImage || !productDetailsDescription || !productDetailsPrice || !productDetailsRating || !productDetailsCategory || !productDetailsDiscount) {

        console.error("Product details modal elements not found. Cannot open modal.");

        return;

    }

    productDetailsTitle.textContent = product.name;

    productDetailsCategory.textContent = `التصنيف: ${product.category || 'غير محدد'}`; 

    productDetailsDescription.textContent = `الوصف: ${product.description || 'لا يوجد وصف.'}`;

    productDetailsRating.innerHTML = `التقييم: ${product.rating} / 5 <span class="material-symbols-outlined text-base ml-1">star</span>`;

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

        productDetailsDiscount.textContent = '';

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

// Theme functions (Dark/Light mode)

function toggleDarkMode() {

    isDarkMode = !isDarkMode;

    localStorage.setItem('darkMode', isDarkMode);

    applyTheme();

}

function applyTheme() {

    if (!document.body || !modeToggleIcon) {

        console.warn("Critical header elements not found for theme application. Retrying in 50ms.");

        setTimeout(applyTheme, 50);

        return;

    }

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');

    headerIcons.forEach(icon => {

        if (!icon) return;

        if (icon.id !== 'modeToggleIcon' && icon.id !== 'menuDropdownIcon') {

            if (isDarkMode) {

                icon.style.color = 'var(--light-red)';

            } else {

                icon.style.color = 'var(--primary-red)';

            }

        }

    });

    // Update product card colors in dark mode

    const productItems = document.querySelectorAll('.product-item');

    productItems.forEach(item => {

        if (isDarkMode) {

            item.style.backgroundColor = 'var(--card-dark)';

            const h4 = item.querySelector('h4');

            const p = item.querySelector('p');

            if (h4) h4.style.color = 'var(--light-red)';

            if (p) p.style.color = 'var(--text-light)';

            const priceSpan = item.querySelector('.product-item-content p.font-bold span');

             if(priceSpan && priceSpan.classList.contains('line-through')) {

                priceSpan.style.color = 'var(--text-light)';

            }

        } else {

            item.style.backgroundColor = 'var(--card-light)';

            const h4 = item.querySelector('h4');

            const p = item.querySelector('p');

            if (h4) h4.style.color = 'var(--primary-red)';

            if (p) p.style.color = 'var(--text-dark)';

            const priceSpan = item.querySelector('.product-item-content p.font-bold span');

            if(priceSpan && priceSpan.classList.contains('line-through')) {

                priceSpan.style.color = '#6b7280';

            }

        }

    });

}

// Function to render products for customers

function renderProductsForCustomers(products) {

    productsList.innerHTML = '';

    if (products.length === 0) {

        noProductsMessage.classList.remove('hidden');

        return;

    }

    noProductsMessage.classList.add('hidden');

    products.forEach(product => {

        const productItem = document.createElement('div');

        productItem.className = `product-item relative cursor-pointer`;

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

                <div class="discount-badge absolute top-2 right-2 bg-primary-red text-white text-xs font-bold py-1 px-2 rounded-full">

                    %${product.discountPercentage} خصم

                </div>

            `;

        }

        productItem.innerHTML = `

            ${discountBadgeHtml} 

            <img src="${product.image || 'https://placehold.co/400x200/cccccc/000000?text=لا توجد صورة'}"

                 alt="${product.name}"

                 onerror="this.onerror=null;this.src='https://placehold.co/400x200/cccccc/000000?text=فشل تحميل الصورة';"

                 loading="lazy"> 

            <div class="product-item-actions hidden">

                </div>

            <div class="product-item-content">

                <h4>${product.name}</h4>

                <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">التصنيف: ${product.category || 'غير محدد'}</p> 

                <p>${product.description}</p>

                ${displayedPriceHtml} 

                <span class="text-yellow-600 text-sm flex items-center mt-2">${product.rating} <span class="material-symbols-outlined text-sm ml-1">star</span></span>

            </div>

            <div class="flex justify-center p-4 border-t border-gray-200 dark:border-gray-700">

                <button data-id="${product.id}" class="view-details-btn text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full transition-colors duration-200" title="عرض التفاصيل">

                    <span class="material-symbols-outlined">info</span>

                </button>

            </div>

        `;

        productsList.appendChild(productItem);

        // Add event listener to open product details when clicking anywhere on the card

        productItem.addEventListener('click', (e) => {

            // Ensure click was not on the dedicated 'view details' button (which has its own handler)

            if (!e.target.closest('.view-details-btn')) {

                openProductDetailsModal(product);

            }

        });

    });

    // Add event listeners for the specific 'view details' buttons

    document.querySelectorAll('.view-details-btn').forEach(button => {

        button.addEventListener('click', (e) => {

            const productId = e.currentTarget.dataset.id;

            const productToShow = products.find(p => p.id === productId);

            if (productToShow) {

                openProductDetailsModal(productToShow);

            }

        });

    });

    applyTheme();

}

// DOMContentLoaded Listener - Ensures all HTML is loaded before running JS

document.addEventListener('DOMContentLoaded', () => {

    // **Assign DOM elements here (CRITICAL for proper functioning)**

    modeToggleButton = document.getElementById('modeToggleButton');

    modeToggleIcon = document.getElementById('modeToggleIcon');

    menuDropdownButton = document.getElementById('menuDropdownButton');

    menuDropdown = document.getElementById('menuDropdown');

    menuDropdownIcon = document.getElementById('menuDropdownIcon');

    universalModal = document.getElementById('universalModal');

    modalTitle = document.getElementById('modalTitle');

    modalContent = document.getElementById('modalContent');

    modalActions = document.getElementById('modalActions');

    loadingIndicator = document.getElementById('loadingIndicator');

    // Make sure these are correctly assigned

    productDetailsModal = document.getElementById('productDetailsModal');

    productDetailsTitle = document.getElementById('productDetailsTitle');

    productDetailsImage = document.getElementById('productDetailsImage');

    productDetailsDescription = document.getElementById('productDetailsDescription');

    productDetailsPrice = document.getElementById('productDetailsPrice');

    productDetailsRating = document.getElementById('productDetailsRating');

    productDetailsCategory = document.getElementById('productDetailsCategory'); 

    productDetailsDiscount = document.getElementById('productDetailsDiscount');

    productDetailsCloseButton = document.getElementById('productDetailsCloseButton'); // تعيين زر الإغلاق النصي الجديد

    productsList = document.getElementById('productsList');

    noProductsMessage = document.getElementById('noProductsMessage');

    // Initial theme application based on localStorage

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

                productDetailsModal.classList.remove('active'); // إغلاق النافذة بالنقر خارجها

                document.body.classList.remove('no-scroll');

            }

        });

    }

    

    // **مستمع الحدث الجديد لزر الإغلاق النصي**

    if (productDetailsCloseButton) {

        productDetailsCloseButton.addEventListener('click', () => {

            if (productDetailsModal) {

                productDetailsModal.classList.remove('active');

                document.body.classList.remove('no-scroll');

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

            menuDropdownIcon.textContent = isShowing ? 'close' : 'menu';

        });

        // Close Dropdown Menu when clicking outside

        document.addEventListener('click', (event) => {

            if (menuDropdown && menuDropdownButton && !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {

                menuDropdown.classList.remove('show');

                menuDropdownIcon.textContent = 'menu';

            }

        });

    }

    // Firebase Auth State Listener

    onAuthStateChanged(auth, async (user) => {

        try {

            if (user) {

                currentUserId = user.uid;

                // Path to products collection. Ensure your products are stored under this user's ID

                const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

                const q = query(productsCollectionRef, orderBy('name', 'asc')); 

                openModal('جاري التحميل', 'جاري جلب المنتجات، الرجاء الانتظار...', [], true);

                onSnapshot(q, (snapshot) => {

                    closeModal();

                    const products = [];

                    snapshot.forEach(doc => {

                        products.push({ id: doc.id, ...doc.data() });

                    });

                    renderProductsForCustomers(products);

                }, (error) => {

                    console.error("خطأ في جلب المنتجات من Firestore:", error);

                    openModal('خطأ', `فشل جلب المنتجات: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                });

            } else {

                // Sign in anonymously to allow data fetching

                try {

                    await signInAnonymously(auth);

                } catch (authError) {

                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);

                    openModal('خطأ', `تعذر الاتصال بقاعدة البيانات. الرجاء المحاولة لاحقًا.`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                }

            }

        } finally {

            // Any final cleanup if needed

        }

    });

});