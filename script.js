const API_URL = 'http://127.0.0.1:5000/api/v1';

// ==================== ОБЩИЕ ФУНКЦИИ ====================
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    
    if (sectionId === 'guests') {
        loadGuests();
    } else if (sectionId === 'rooms') {
        loadRooms();
    } else if (sectionId === 'bookings') {
        loadBookings();
    } else if (sectionId === 'prices') {
        loadPrices();
    }
}

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка API:', error);
        showError(`Ошибка: ${error.message}`);
        throw error;
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.body.prepend(successDiv);
    
    setTimeout(() => successDiv.remove(), 5000);
}

// ==================== РАБОТА С ГОСТЯМИ ==================
async function loadGuests() {
    try {
        const guestsList = document.getElementById('guests-list');
        guestsList.innerHTML = 'Загрузка...';
        
        const guests = await apiCall('/guests');
        displayGuests(guests);
    } catch (error) {
        document.getElementById('guests-list').innerHTML = 'Ошибка загрузки гостей';
    }
}

function displayGuests(guests) {
    const container = document.getElementById('guests-list');
    
    if (guests.length === 0) {
        container.innerHTML = '<p>Гостей нет в базе данных.</p>';
        return;
    }
    
    container.innerHTML = guests.map(guest => `
        <div class="guest-item">
            <h4>${guest.name}</h4>
            <p><strong>Телефон:</strong> ${guest.phone}</p>
            ${guest.email ? `<p><strong>Email:</strong> ${guest.email}</p>` : ''}
            ${guest.passport_series ? `<p><strong>Паспорт:</strong> ${guest.passport_series} №${guest.passport_number}</p>` : ''}
            <button onclick="deleteGuest(${guest.id})">Удалить</button>
        </div>
    `).join('');
}

async function handleAddGuest(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('guest-name').value,
        phone: document.getElementById('guest-phone').value,
        email: document.getElementById('guest-email').value || null,
        passport_series: document.getElementById('guest-passport-series').value || null,
        passport_number: document.getElementById('guest-passport-number').value || null
    };
    
    try {
        await apiCall('/guests', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showSuccess('Гость успешно добавлен!');
        document.getElementById('add-guest-form').reset();
        loadGuests();
    } catch (error) {
        console.error('Ошибка добавления гостя:', error);
    }
}

async function searchGuestByPhone() {
    const phone = document.getElementById('search-phone').value;
    if (!phone) {
        showError('Введите номер телефона для поиска');
        return;
    }
    
    try {
        const guest = await apiCall(`/guests/search?phone=${encodeURIComponent(phone)}`);
        document.getElementById('search-result').innerHTML = `
            <div class="guest-item">
                <h4>Найденный гость:</h4>
                <p><strong>Имя:</strong> ${guest.name}</p>
                <p><strong>Телефон:</strong> ${guest.phone}</p>
                ${guest.email ? `<p><strong>Email:</strong> ${guest.email}</p>` : ''}
            </div>
        `;
    } catch (error) {
        document.getElementById('search-result').innerHTML = '<div class="error">Гость не найден</div>';
    }
}

async function deleteGuest(guestId) {
    if (!confirm('Вы уверены, что хотите удалить гостя?')) return;
    
    try {
        await apiCall(`/guests/${guestId}`, { method: 'DELETE' });
        showSuccess('Гость успешно удален!');
        loadGuests();
    } catch (error) {
        showError('Ошибка при удалении гостя');
    }
}

// ==================== РАБОТА С НОМЕРАМИ ====================
async function loadRooms() {
    try {
        const roomsList = document.getElementById('rooms-list');
        roomsList.innerHTML = 'Загрузка...';
        
        const rooms = await apiCall('/rooms');
        displayRooms(rooms);
    } catch (error) {
        document.getElementById('rooms-list').innerHTML = 'Ошибка загрузки номеров';
    }
}

function displayRooms(rooms) {
    const container = document.getElementById('rooms-list');
    
    if (rooms.length === 0) {
        container.innerHTML = '<p>Номеров нет в базе данных.</p>';
        return;
    }
    
    container.innerHTML = rooms.map(room => `
        <div class="room-item">
            <h4>Номер ${room.room_number}</h4>
            <p><strong>Категория:</strong> ${room.category}</p>
            <p><strong>Вместимость:</strong> ${room.capacity} чел.</p>
            <p><strong>Детская кровать:</strong> ${room.has_child_bed ? 'Да' : 'Нет'}</p>
        </div>
    `).join('');
}

async function handleAddRoom(event) {
    event.preventDefault();
    
    const formData = {
        room_number: document.getElementById('room-number').value,
        category: document.getElementById('room-category').value,
        capacity: parseInt(document.getElementById('room-capacity').value),
        has_child_bed: document.getElementById('room-child-bed').checked
    };
    
    try {
        await apiCall('/rooms', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showSuccess('Номер успешно добавлен!');
        document.getElementById('add-room-form').reset();
        loadRooms();
    } catch (error) {
        showError('Ошибка при добавлении номера');
    }
}

async function checkAvailability() {
    const checkIn = document.getElementById('check-in-date').value;
    const checkOut = document.getElementById('check-out-date').value;
    
    if (!checkIn || !checkOut) {
        showError('Выберите даты заезда и выезда');
        return;
    }
    
    try {
        const availableRooms = await apiCall(`/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
        displayAvailableRooms(availableRooms);
    } catch (error) {
        document.getElementById('available-rooms-list').innerHTML = '<div class="error">Ошибка проверки доступности</div>';
    }
}

function displayAvailableRooms(rooms) {
    const container = document.getElementById('available-rooms-list');
    
    if (rooms.length === 0) {
        container.innerHTML = '<p>Нет доступных номеров на выбранные даты.</p>';
        return;
    }
    
    container.innerHTML = `
        <h4>Доступные номера:</h4>
        ${rooms.map(room => `
            <div class="room-item available">
                <h4>Номер ${room.room_number}</h4>
                <p><strong>Категория:</strong> ${room.category}</p>
                <p><strong>Вместимость:</strong> ${room.capacity} чел.</p>
                <p><strong>Детская кровать:</strong> ${room.has_child_bed ? 'Да' : 'Нет'}</p>
                <button onclick="selectRoom(${room.id}, '${room.room_number}')">Выбрать этот номер</button>
            </div>
        `).join('')}
    `;
}

function selectRoom(roomId, roomNumber) {
    document.getElementById('selected-room-id').value = roomId;
    document.getElementById('available-rooms-select').innerHTML = `
        <p><strong>Выбран номер:</strong> ${roomNumber}</p>
    `;
}

// ==================== РАБОТА С БРОНИРОВАНИЯМИ ====================
async function loadBookings() {
    try {
        const bookingsList = document.getElementById('bookings-list');
        bookingsList.innerHTML = 'Загрузка...';
        
        const bookings = await apiCall('/bookings');
        displayBookings(bookings);
    } catch (error) {
        document.getElementById('bookings-list').innerHTML = 'Ошибка загрузки бронирований';
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookings-list');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p>Бронирований нет.</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="booking-item ${booking.status.toLowerCase()}">
            <h4>Бронирование #${booking.id}</h4>
            <p><strong>Номер:</strong> ${booking.room_number} (${booking.category})</p>
            <p><strong>Гость:</strong> ${booking.main_guest_name}</p>
            <p><strong>Заезд:</strong> ${booking.check_in_date}</p>
            <p><strong>Выезд:</strong> ${booking.check_out_date}</p>
            <p><strong>Статус:</strong> ${booking.status}</p>
            <p><strong>Скидка:</strong> ${booking.discount}%</p>
            <button onclick="cancelBooking(${booking.id})">Отменить</button>
        </div>
    `).join('');
}

async function searchGuestForBooking() {
    const phone = document.getElementById('booking-guest-phone').value;
    if (!phone) {
        showError('Введите номер телефона гостя');
        return;
    }
    
    try {
        const guest = await apiCall(`/guests/search?phone=${encodeURIComponent(phone)}`);
        document.getElementById('guest-search-result').innerHTML = `
            <div class="search-result">
                <p><strong>Найден:</strong> ${guest.name} (тел: ${guest.phone})</p>
                <button onclick="setMainGuest(${guest.id}, '${guest.name}')">Выбрать основным гостем</button>
            </div>
        `;
    } catch (error) {
        document.getElementById('guest-search-result').innerHTML = '<div class="error">Гость не найден</div>';
    }
}

function setMainGuest(guestId, guestName) {
    document.getElementById('main-guest-id').value = guestId;
    document.getElementById('guest-search-result').innerHTML = `
        <div class="success">
            <p>Основной гость: ${guestName}</p>
        </div>
    `;
}

function addGuestField() {
    const container = document.getElementById('additional-guests');
    const newField = document.createElement('div');
    newField.innerHTML = `
        <input type="tel" placeholder="Телефон дополнительного гостя" 
               onchange="findGuestByPhone(this)">
    `;
    container.appendChild(newField);
}

async function findGuestByPhone(input) {
    const phone = input.value;
    if (!phone) return;
    
    try {
        const guest = await apiCall(`/guests/search?phone=${encodeURIComponent(phone)}`);
        input.style.borderColor = '#27ae60';
    } catch (error) {
        input.style.borderColor = '#e74c3c';
        showError('Гость с таким телефоном не найден');
    }
}

async function handleCreateBooking(event) {
    event.preventDefault();
    
    const formData = {
        room_id: parseInt(document.getElementById('selected-room-id').value),
        main_guest_id: parseInt(document.getElementById('main-guest-id').value),
        check_in_date: document.getElementById('booking-check-in').value,
        check_out_date: document.getElementById('booking-check-out').value,
        status: 'Подтверждено',
        discount: 0,
        guest_ids: [parseInt(document.getElementById('main-guest-id').value)]
    };
    
    try {
        await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showSuccess('Бронирование успешно создано!');
        document.getElementById('create-booking-form').reset();
        document.getElementById('additional-guests').innerHTML = '';
        document.getElementById('available-rooms-select').innerHTML = '';
        document.getElementById('guest-search-result').innerHTML = '';
        loadBookings();
    } catch (error) {
        showError('Ошибка при создании бронирования');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;
    
    try {
        await apiCall(`/bookings/${bookingId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Отменено' })
        });
        
        showSuccess('Бронирование отменено!');
        loadBookings();
    } catch (error) {
        showError('Ошибка при отмене бронирования');
    }
}

// ==================== РАБОТА С ЦЕНАМИ ====================
async function loadPrices() {
    try {
        const pricesList = document.getElementById('prices-list');
        pricesList.innerHTML = 'Загрузка...';
        
        const prices = await apiCall('/prices');
        displayPrices(prices);
    } catch (error) {
        document.getElementById('prices-list').innerHTML = 'Ошибка загрузки цен';
    }
}

function displayPrices(prices) {
    const container = document.getElementById('prices-list');
    
    if (prices.length === 0) {
        container.innerHTML = '<p>Цены не установлены.</p>';
        return;
    }
    
    container.innerHTML = `
        <h4>Текущие цены:</h4>
        ${prices.map(price => `
            <div class="price-item">
                <p><strong>Номер ${price.room_number}:</strong> ${price.day_of_week} - ${price.price} руб.</p>
            </div>
        `).join('')}
    `;
}

async function handleAddPrice(event) {
    event.preventDefault();
    
    const formData = {
        room_id: parseInt(document.getElementById('price-room-id').value),
        day_of_week: document.getElementById('price-day').value,
        price: parseFloat(document.getElementById('price-amount').value)
    };
    
    try {
        await apiCall('/prices', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showSuccess('Цена успешно установлена!');
        document.getElementById('add-price-form').reset();
        loadPrices();
    } catch (error) {
        showError('Ошибка при установке цены');
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    // Назначаем обработчики форм
    document.getElementById('add-guest-form').addEventListener('submit', handleAddGuest);
    document.getElementById('add-room-form').addEventListener('submit', handleAddRoom);
    document.getElementById('create-booking-form').addEventListener('submit', handleCreateBooking);
    document.getElementById('add-price-form').addEventListener('submit', handleAddPrice);
    
    // Загружаем начальные данные
    loadGuests();
    loadRooms();
    
    // Заполняем select для выбора номеров в разделе цен
    loadRoomsForPriceSelect();
});

async function loadRoomsForPriceSelect() {
    try {
        const rooms = await apiCall('/rooms');
        const select = document.getElementById('price-room-id');
        
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = `Номер ${room.room_number} (${room.category})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки номеров для select:', error);
    }
}