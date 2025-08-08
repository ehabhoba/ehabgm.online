export class ServicesManager {
    constructor() {
        this.servicesGrid = document.getElementById('services-grid');
        this.addServiceBtn = document.getElementById('add-service-btn');
        this.services = [];
    }

    async init() {
        this.bindEvents();
        await this.loadServices();
    }

    bindEvents() {
        this.addServiceBtn.addEventListener('click', () => {
            this.showAddServiceModal();
        });
    }

    async loadServices() {
        try {
            const { data, error } = await window.app.dbClient
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading services:', error);
                showNotification('خطأ في تحميل الخدمات', 'error');
                return;
            }

            this.services = data || [];
            this.renderServices();
        } catch (error) {
            console.error('Error loading services:', error);
            showNotification('خطأ في تحميل الخدمات', 'error');
        }
    }

    renderServices() {
        if (!this.servicesGrid) return;

        this.servicesGrid.innerHTML = '';

        if (this.services.length === 0) {
            this.servicesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #666;">
                    <i data-feather="briefcase" style="width: 48px; height: 48px; margin-bottom: 20px;"></i>
                    <h3>لا توجد خدمات متاحة حالياً</h3>
                    <p>ابدأ بإضافة خدمة جديدة</p>
                </div>
            `;
            feather.replace();
            return;
        }

        this.services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.classList.add('service-card');
            serviceCard.innerHTML = `
                <h3>${service.service_name}</h3>
                <p>${service.description || 'لا يوجد وصف'}</p>
                <div class="price">${formatCurrency(service.price)}</div>
                <div class="service-actions">
                    <button class="btn btn-small btn-primary" onclick="window.app.managers.services.viewService('${service.id}')">
                        <i data-feather="eye"></i>
                        عرض
                    </button>
                    <button class="btn btn-small btn-warning" onclick="window.app.managers.services.editService('${service.id}')">
                        <i data-feather="edit"></i>
                        تعديل
                    </button>
                    <button class="btn btn-small btn-error" onclick="window.app.managers.services.deleteService('${service.id}')">
                        <i data-feather="trash-2"></i>
                        حذف
                    </button>
                </div>
            `;
            this.servicesGrid.appendChild(serviceCard);
        });

        // Replace feather icons
        feather.replace();
    }

    showAddServiceModal() {
        const modalContent = `
            <h2>إضافة خدمة جديدة</h2>
            <form id="add-service-form">
                <div class="form-group">
                    <label for="service-name">اسم الخدمة</label>
                    <input type="text" id="service-name" required placeholder="أدخل اسم الخدمة">
                </div>
                <div class="form-group">
                    <label for="service-description">وصف الخدمة</label>
                    <textarea id="service-description" placeholder="أدخل وصف مفصل للخدمة..."></textarea>
                </div>
                <div class="form-group">
                    <label for="service-price">السعر (جنيه مصري)</label>
                    <input type="number" id="service-price" required min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label for="service-category">الفئة</label>
                    <select id="service-category">
                        <option value="graphic_design">تصميم جرافيك</option>
                        <option value="digital_marketing">تسويق رقمي</option>
                        <option value="social_media">إدارة وسائل التواصل</option>
                        <option value="web_design">تصميم مواقع</option>
                        <option value="seo">تحسين محركات البحث</option>
                        <option value="content_creation">إنتاج المحتوى</option>
                        <option value="branding">هوية تجارية</option>
                        <option value="photography">تصوير فوتوغرافي</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="service-duration">مدة التنفيذ (بالأيام)</label>
                    <input type="number" id="service-duration" min="1" placeholder="عدد الأيام">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i data-feather="plus"></i>
                        إضافة الخدمة
                    </button>
                </div>
            </form>
        `;

        window.app.managers.modal.show(modalContent);
        this.bindAddServiceForm();
    }

    bindAddServiceForm() {
        const form = document.getElementById('add-service-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddService(form);
            });
        }
    }

    async handleAddService(form) {
        const serviceName = document.getElementById('service-name').value;
        const description = document.getElementById('service-description').value;
        const price = parseFloat(document.getElementById('service-price').value);
        const category = document.getElementById('service-category').value;
        const duration = parseInt(document.getElementById('service-duration').value) || null;

        try {
            const { data, error } = await window.app.dbClient
                .from('services')
                .insert([
                    {
                        service_name: serviceName,
                        description: description,
                        price: price,
                        category: category,
                        duration_days: duration
                    }
                ]);

            if (error) {
                console.error('Error adding service:', error);
                showNotification('خطأ في إضافة الخدمة', 'error');
                return;
            }

            showNotification('تم إضافة الخدمة بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadServices();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error adding service:', error);
            showNotification('خطأ في إضافة الخدمة', 'error');
        }
    }

    async viewService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        const modalContent = `
            <h2>تفاصيل الخدمة: ${service.service_name}</h2>
            <div class="service-details">
                <p><strong>الوصف:</strong> ${service.description || 'لا يوجد وصف'}</p>
                <p><strong>السعر:</strong> ${formatCurrency(service.price)}</p>
                <p><strong>الفئة:</strong> ${this.getCategoryText(service.category)}</p>
                ${service.duration_days ? `<p><strong>مدة التنفيذ:</strong> ${service.duration_days} يوم</p>` : ''}
                <p><strong>تاريخ الإضافة:</strong> ${formatDate(service.created_at)}</p>
            </div>
        `;

        window.app.managers.modal.show(modalContent);
    }

    async editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        const modalContent = `
            <h2>تعديل الخدمة: ${service.service_name}</h2>
            <form id="edit-service-form">
                <div class="form-group">
                    <label for="edit-service-name">اسم الخدمة</label>
                    <input type="text" id="edit-service-name" required value="${service.service_name}">
                </div>
                <div class="form-group">
                    <label for="edit-service-description">وصف الخدمة</label>
                    <textarea id="edit-service-description">${service.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-service-price">السعر (جنيه مصري)</label>
                    <input type="number" id="edit-service-price" required min="0" step="0.01" value="${service.price}">
                </div>
                <div class="form-group">
                    <label for="edit-service-category">الفئة</label>
                    <select id="edit-service-category">
                        <option value="graphic_design" ${service.category === 'graphic_design' ? 'selected' : ''}>تصميم جرافيك</option>
                        <option value="digital_marketing" ${service.category === 'digital_marketing' ? 'selected' : ''}>تسويق رقمي</option>
                        <option value="social_media" ${service.category === 'social_media' ? 'selected' : ''}>إدارة وسائل التواصل</option>
                        <option value="web_design" ${service.category === 'web_design' ? 'selected' : ''}>تصميم مواقع</option>
                        <option value="seo" ${service.category === 'seo' ? 'selected' : ''}>تحسين محركات البحث</option>
                        <option value="content_creation" ${service.category === 'content_creation' ? 'selected' : ''}>إنتاج المحتوى</option>
                        <option value="branding" ${service.category === 'branding' ? 'selected' : ''}>هوية تجارية</option>
                        <option value="photography" ${service.category === 'photography' ? 'selected' : ''}>تصوير فوتوغرافي</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-service-duration">مدة التنفيذ (بالأيام)</label>
                    <input type="number" id="edit-service-duration" min="1" value="${service.duration_days || ''}">
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
        this.bindEditServiceForm(serviceId);
    }

    bindEditServiceForm(serviceId) {
        const form = document.getElementById('edit-service-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEditService(serviceId, form);
            });
        }
    }

    async handleEditService(serviceId, form) {
        const serviceName = document.getElementById('edit-service-name').value;
        const description = document.getElementById('edit-service-description').value;
        const price = parseFloat(document.getElementById('edit-service-price').value);
        const category = document.getElementById('edit-service-category').value;
        const duration = parseInt(document.getElementById('edit-service-duration').value) || null;

        try {
            const { error } = await window.app.dbClient
                .from('services')
                .update({
                    service_name: serviceName,
                    description: description,
                    price: price,
                    category: category,
                    duration_days: duration
                })
                .eq('id', serviceId);

            if (error) {
                console.error('Error updating service:', error);
                showNotification('خطأ في تحديث الخدمة', 'error');
                return;
            }

            showNotification('تم تحديث الخدمة بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadServices();
        } catch (error) {
            console.error('Error updating service:', error);
            showNotification('خطأ في تحديث الخدمة', 'error');
        }
    }

    async deleteService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        if (!confirm(`هل أنت متأكد من حذف الخدمة "${service.service_name}"؟`)) {
            return;
        }

        try {
            const { error } = await window.app.dbClient
                .from('services')
                .delete()
                .eq('id', serviceId);

            if (error) {
                console.error('Error deleting service:', error);
                showNotification('خطأ في حذف الخدمة', 'error');
                return;
            }

            showNotification('تم حذف الخدمة بنجاح', 'success');
            await this.loadServices();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error deleting service:', error);
            showNotification('خطأ في حذف الخدمة', 'error');
        }
    }

    getCategoryText(category) {
        const categoryMap = {
            'graphic_design': 'تصميم جرافيك',
            'digital_marketing': 'تسويق رقمي',
            'social_media': 'إدارة وسائل التواصل',
            'web_design': 'تصميم مواقع',
            'seo': 'تحسين محركات البحث',
            'content_creation': 'إنتاج المحتوى',
            'branding': 'هوية تجارية',
            'photography': 'تصوير فوتوغرافي'
        };
        return categoryMap[category] || category;
    }

    onSectionShow() {
        this.loadServices();
    }
}