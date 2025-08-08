export class OrdersManager {
    constructor() {
        this.ordersTable = document.getElementById('orders-table');
        this.ordersTbody = document.getElementById('orders-tbody');
        this.addOrderBtn = document.getElementById('add-order-btn');
        this.orders = [];
    }

    async init() {
        this.bindEvents();
        await this.loadOrders();
    }

    bindEvents() {
        this.addOrderBtn.addEventListener('click', () => {
            this.showAddOrderModal();
        });
    }

    async loadOrders() {
        try {
            const { data, error } = await window.app.dbClient
                .from('orders')
                .select(`
                    *,
                    users(name, email),
                    services(service_name, price)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading orders:', error);
                showNotification('خطأ في تحميل الطلبات', 'error');
                return;
            }

            this.orders = data || [];
            this.renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('خطأ في تحميل الطلبات', 'error');
        }
    }

    renderOrders() {
        if (!this.ordersTbody) return;

        this.ordersTbody.innerHTML = '';

        if (this.orders.length === 0) {
            this.ordersTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        لا توجد طلبات حالياً
                    </td>
                </tr>
            `;
            return;
        }

        this.orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id.substring(0, 8)}</td>
                <td>${order.users?.name || 'غير محدد'}</td>
                <td>${order.services?.service_name || 'غير محدد'}</td>
                <td><span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span></td>
                <td>${formatDate(order.created_at)}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="window.app.managers.orders.viewOrder('${order.id}')">
                        <i data-feather="eye"></i>
                        عرض
                    </button>
                    <button class="btn btn-small btn-warning" onclick="window.app.managers.orders.editOrder('${order.id}')">
                        <i data-feather="edit"></i>
                        تعديل
                    </button>
                </td>
            `;
            this.ordersTbody.appendChild(row);
        });

        // Replace feather icons
        feather.replace();
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'قيد الانتظار',
            'active': 'نشط',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    }

    showAddOrderModal() {
        const modalContent = `
            <h2>إضافة طلب جديد</h2>
            <form id="add-order-form">
                <div class="form-group">
                    <label for="client-select">العميل</label>
                    <select id="client-select" required>
                        <option value="">اختر العميل</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="service-select">الخدمة</label>
                    <select id="service-select" required>
                        <option value="">اختر الخدمة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="order-notes">ملاحظات</label>
                    <textarea id="order-notes" placeholder="أدخل أي ملاحظات إضافية..."></textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i data-feather="plus"></i>
                        إضافة الطلب
                    </button>
                </div>
            </form>
        `;

        window.app.managers.modal.show(modalContent);
        this.loadClientsAndServices();
        this.bindAddOrderForm();
    }

    async loadClientsAndServices() {
        try {
            // Load clients
            const { data: clients } = await window.app.dbClient
                .from('users')
                .select('id, name')
                .eq('role', 'client');

            const clientSelect = document.getElementById('client-select');
            if (clientSelect && clients) {
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name;
                    clientSelect.appendChild(option);
                });
            }

            // Load services
            const { data: services } = await window.app.dbClient
                .from('services')
                .select('id, service_name, price');

            const serviceSelect = document.getElementById('service-select');
            if (serviceSelect && services) {
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = `${service.service_name} - ${formatCurrency(service.price)}`;
                    serviceSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading clients and services:', error);
        }
    }

    bindAddOrderForm() {
        const form = document.getElementById('add-order-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddOrder(form);
            });
        }
    }

    async handleAddOrder(form) {
        const formData = new FormData(form);
        const clientId = document.getElementById('client-select').value;
        const serviceId = document.getElementById('service-select').value;
        const notes = document.getElementById('order-notes').value;

        try {
            const { data, error } = await window.app.dbClient
                .from('orders')
                .insert([
                    {
                        user_id: clientId,
                        service_id: serviceId,
                        notes: notes,
                        status: 'pending'
                    }
                ]);

            if (error) {
                console.error('Error adding order:', error);
                showNotification('خطأ في إضافة الطلب', 'error');
                return;
            }

            showNotification('تم إضافة الطلب بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadOrders();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error adding order:', error);
            showNotification('خطأ في إضافة الطلب', 'error');
        }
    }

    async viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modalContent = `
            <h2>تفاصيل الطلب #${order.id.substring(0, 8)}</h2>
            <div class="order-details">
                <p><strong>العميل:</strong> ${order.users?.name || 'غير محدد'}</p>
                <p><strong>البريد الإلكتروني:</strong> ${order.users?.email || 'غير محدد'}</p>
                <p><strong>الخدمة:</strong> ${order.services?.service_name || 'غير محدد'}</p>
                <p><strong>السعر:</strong> ${formatCurrency(order.services?.price || 0)}</p>
                <p><strong>الحالة:</strong> <span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span></p>
                <p><strong>تاريخ الإنشاء:</strong> ${formatDate(order.created_at)}</p>
                ${order.notes ? `<p><strong>الملاحظات:</strong> ${order.notes}</p>` : ''}
            </div>
        `;

        window.app.managers.modal.show(modalContent);
    }

    async editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modalContent = `
            <h2>تعديل الطلب #${order.id.substring(0, 8)}</h2>
            <form id="edit-order-form">
                <div class="form-group">
                    <label for="edit-status">الحالة</label>
                    <select id="edit-status" required>
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                        <option value="active" ${order.status === 'active' ? 'selected' : ''}>نشط</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-notes">الملاحظات</label>
                    <textarea id="edit-notes">${order.notes || ''}</textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i data-feather="save"></i>
                        حفظ التغييرات
                    </button>
                </div>
            </form>
        `;

        window.app.managers.modal.show(modalContent);
        this.bindEditOrderForm(orderId);
    }

    bindEditOrderForm(orderId) {
        const form = document.getElementById('edit-order-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEditOrder(orderId, form);
            });
        }
    }

    async handleEditOrder(orderId, form) {
        const status = document.getElementById('edit-status').value;
        const notes = document.getElementById('edit-notes').value;

        try {
            const { error } = await window.app.dbClient
                .from('orders')
                .update({
                    status: status,
                    notes: notes
                })
                .eq('id', orderId);

            if (error) {
                console.error('Error updating order:', error);
                showNotification('خطأ في تحديث الطلب', 'error');
                return;
            }

            showNotification('تم تحديث الطلب بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadOrders();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error updating order:', error);
            showNotification('خطأ في تحديث الطلب', 'error');
        }
    }

    onSectionShow() {
        this.loadOrders();
    }
}