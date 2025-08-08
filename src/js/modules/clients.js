export class ClientsManager {
    constructor() {
        this.clientsTable = document.getElementById('clients-table');
        this.clientsTbody = document.getElementById('clients-tbody');
        this.addClientBtn = document.getElementById('add-client-btn');
        this.clients = [];
    }

    async init() {
        this.bindEvents();
        await this.loadClients();
    }

    bindEvents() {
        this.addClientBtn.addEventListener('click', () => {
            this.showAddClientModal();
        });
    }

    async loadClients() {
        try {
            const { data, error } = await window.app.dbClient
                .from('users')
                .select('*')
                .eq('role', 'client')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading clients:', error);
                showNotification('خطأ في تحميل العملاء', 'error');
                return;
            }

            this.clients = data || [];
            this.renderClients();
        } catch (error) {
            console.error('Error loading clients:', error);
            showNotification('خطأ في تحميل العملاء', 'error');
        }
    }

    renderClients() {
        if (!this.clientsTbody) return;

        this.clientsTbody.innerHTML = '';

        if (this.clients.length === 0) {
            this.clientsTbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                        لا يوجد عملاء مسجلين حالياً
                    </td>
                </tr>
            `;
            return;
        }

        this.clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone_number || 'غير محدد'}</td>
                <td>${formatDate(client.created_at)}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="window.app.managers.clients.viewClient('${client.id}')">
                        <i data-feather="eye"></i>
                        عرض
                    </button>
                    <button class="btn btn-small btn-warning" onclick="window.app.managers.clients.editClient('${client.id}')">
                        <i data-feather="edit"></i>
                        تعديل
                    </button>
                </td>
            `;
            this.clientsTbody.appendChild(row);
        });

        // Replace feather icons
        feather.replace();
    }

    showAddClientModal() {
        const modalContent = `
            <h2>إضافة عميل جديد</h2>
            <form id="add-client-form">
                <div class="form-group">
                    <label for="client-name">الاسم الكامل</label>
                    <input type="text" id="client-name" required placeholder="أدخل اسم العميل">
                </div>
                <div class="form-group">
                    <label for="client-email">البريد الإلكتروني</label>
                    <input type="email" id="client-email" required placeholder="أدخل البريد الإلكتروني">
                </div>
                <div class="form-group">
                    <label for="client-phone">رقم الهاتف</label>
                    <input type="tel" id="client-phone" placeholder="أدخل رقم الهاتف">
                </div>
                <div class="form-group">
                    <label for="client-company">اسم الشركة (اختياري)</label>
                    <input type="text" id="client-company" placeholder="أدخل اسم الشركة">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i data-feather="user-plus"></i>
                        إضافة العميل
                    </button>
                </div>
            </form>
        `;

        window.app.managers.modal.show(modalContent);
        this.bindAddClientForm();
    }

    bindAddClientForm() {
        const form = document.getElementById('add-client-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddClient(form);
            });
        }
    }

    async handleAddClient(form) {
        const name = document.getElementById('client-name').value;
        const email = document.getElementById('client-email').value;
        const phone = document.getElementById('client-phone').value;
        const company = document.getElementById('client-company').value;

        try {
            const { data, error } = await window.app.dbClient
                .from('users')
                .insert([
                    {
                        name: name,
                        email: email,
                        phone_number: phone,
                        company: company,
                        role: 'client'
                    }
                ]);

            if (error) {
                console.error('Error adding client:', error);
                showNotification('خطأ في إضافة العميل', 'error');
                return;
            }

            showNotification('تم إضافة العميل بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadClients();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error adding client:', error);
            showNotification('خطأ في إضافة العميل', 'error');
        }
    }

    async viewClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        // Get client's orders
        const { data: orders } = await window.app.dbClient
            .from('orders')
            .select(`
                *,
                services(service_name, price)
            `)
            .eq('user_id', clientId)
            .order('created_at', { ascending: false });

        const ordersHtml = orders && orders.length > 0 
            ? orders.map(order => `
                <li>
                    ${order.services?.service_name || 'غير محدد'} - 
                    <span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span>
                    (${formatDate(order.created_at)})
                </li>
            `).join('')
            : '<li>لا توجد طلبات</li>';

        const modalContent = `
            <h2>تفاصيل العميل</h2>
            <div class="client-details">
                <p><strong>الاسم:</strong> ${client.name}</p>
                <p><strong>البريد الإلكتروني:</strong> ${client.email}</p>
                <p><strong>رقم الهاتف:</strong> ${client.phone_number || 'غير محدد'}</p>
                <p><strong>الشركة:</strong> ${client.company || 'غير محدد'}</p>
                <p><strong>تاريخ التسجيل:</strong> ${formatDate(client.created_at)}</p>
                <h3>الطلبات:</h3>
                <ul>${ordersHtml}</ul>
            </div>
        `;

        window.app.managers.modal.show(modalContent);
    }

    async editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const modalContent = `
            <h2>تعديل بيانات العميل</h2>
            <form id="edit-client-form">
                <div class="form-group">
                    <label for="edit-client-name">الاسم الكامل</label>
                    <input type="text" id="edit-client-name" required value="${client.name}">
                </div>
                <div class="form-group">
                    <label for="edit-client-email">البريد الإلكتروني</label>
                    <input type="email" id="edit-client-email" required value="${client.email}">
                </div>
                <div class="form-group">
                    <label for="edit-client-phone">رقم الهاتف</label>
                    <input type="tel" id="edit-client-phone" value="${client.phone_number || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-client-company">اسم الشركة</label>
                    <input type="text" id="edit-client-company" value="${client.company || ''}">
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
        this.bindEditClientForm(clientId);
    }

    bindEditClientForm(clientId) {
        const form = document.getElementById('edit-client-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEditClient(clientId, form);
            });
        }
    }

    async handleEditClient(clientId, form) {
        const name = document.getElementById('edit-client-name').value;
        const email = document.getElementById('edit-client-email').value;
        const phone = document.getElementById('edit-client-phone').value;
        const company = document.getElementById('edit-client-company').value;

        try {
            const { error } = await window.app.dbClient
                .from('users')
                .update({
                    name: name,
                    email: email,
                    phone_number: phone,
                    company: company
                })
                .eq('id', clientId);

            if (error) {
                console.error('Error updating client:', error);
                showNotification('خطأ في تحديث بيانات العميل', 'error');
                return;
            }

            showNotification('تم تحديث بيانات العميل بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadClients();
        } catch (error) {
            console.error('Error updating client:', error);
            showNotification('خطأ في تحديث بيانات العميل', 'error');
        }
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

    onSectionShow() {
        this.loadClients();
    }
}