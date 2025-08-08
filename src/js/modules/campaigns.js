export class CampaignsManager {
    constructor() {
        this.campaignsTable = document.getElementById('campaigns-table');
        this.campaignsTbody = document.getElementById('campaigns-tbody');
        this.addCampaignBtn = document.getElementById('add-campaign-btn');
        this.campaigns = [];
    }

    async init() {
        this.bindEvents();
        await this.loadCampaigns();
    }

    bindEvents() {
        this.addCampaignBtn.addEventListener('click', () => {
            this.showAddCampaignModal();
        });
    }

    async loadCampaigns() {
        try {
            const { data, error } = await window.app.dbClient
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading campaigns:', error);
                showNotification('خطأ في تحميل الحملات', 'error');
                return;
            }

            this.campaigns = data || [];
            this.renderCampaigns();
        } catch (error) {
            console.error('Error loading campaigns:', error);
            showNotification('خطأ في تحميل الحملات', 'error');
        }
    }

    renderCampaigns() {
        if (!this.campaignsTbody) return;

        this.campaignsTbody.innerHTML = '';

        if (this.campaigns.length === 0) {
            this.campaignsTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        لا توجد حملات إعلانية حالياً
                    </td>
                </tr>
            `;
            return;
        }

        this.campaigns.forEach(campaign => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${campaign.campaign_name}</td>
                <td>${campaign.platform}</td>
                <td>${formatCurrency(campaign.budget)}</td>
                <td><span class="status-badge status-${campaign.status}">${this.getStatusText(campaign.status)}</span></td>
                <td>${formatDate(campaign.start_date)}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="window.app.managers.campaigns.viewCampaign('${campaign.id}')">
                        <i data-feather="eye"></i>
                        عرض
                    </button>
                    <button class="btn btn-small btn-warning" onclick="window.app.managers.campaigns.editCampaign('${campaign.id}')">
                        <i data-feather="edit"></i>
                        تعديل
                    </button>
                </td>
            `;
            this.campaignsTbody.appendChild(row);
        });

        // Replace feather icons
        feather.replace();
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'قيد الانتظار',
            'active': 'نشط',
            'completed': 'مكتمل',
            'paused': 'متوقف',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    }

    showAddCampaignModal() {
        const modalContent = `
            <h2>إنشاء حملة إعلانية جديدة</h2>
            <form id="add-campaign-form">
                <div class="form-group">
                    <label for="campaign-name">اسم الحملة</label>
                    <input type="text" id="campaign-name" required placeholder="أدخل اسم الحملة">
                </div>
                <div class="form-group">
                    <label for="campaign-platform">المنصة</label>
                    <select id="campaign-platform" required>
                        <option value="">اختر المنصة</option>
                        <option value="Facebook">فيسبوك</option>
                        <option value="Instagram">إنستغرام</option>
                        <option value="Google Ads">إعلانات جوجل</option>
                        <option value="LinkedIn">لينكد إن</option>
                        <option value="Twitter">تويتر</option>
                        <option value="TikTok">تيك توك</option>
                        <option value="Snapchat">سناب شات</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="campaign-budget">الميزانية (جنيه مصري)</label>
                    <input type="number" id="campaign-budget" required min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label for="campaign-start-date">تاريخ البداية</label>
                    <input type="date" id="campaign-start-date" required>
                </div>
                <div class="form-group">
                    <label for="campaign-end-date">تاريخ النهاية</label>
                    <input type="date" id="campaign-end-date">
                </div>
                <div class="form-group">
                    <label for="campaign-objective">هدف الحملة</label>
                    <select id="campaign-objective">
                        <option value="brand_awareness">زيادة الوعي بالعلامة التجارية</option>
                        <option value="traffic">زيادة الزيارات</option>
                        <option value="engagement">زيادة التفاعل</option>
                        <option value="leads">جذب العملاء المحتملين</option>
                        <option value="conversions">زيادة المبيعات</option>
                        <option value="app_installs">تحميل التطبيق</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="campaign-description">وصف الحملة</label>
                    <textarea id="campaign-description" placeholder="أدخل وصف مفصل للحملة..."></textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i data-feather="plus-circle"></i>
                        إنشاء الحملة
                    </button>
                </div>
            </form>
        `;

        window.app.managers.modal.show(modalContent);
        this.bindAddCampaignForm();
    }

    bindAddCampaignForm() {
        const form = document.getElementById('add-campaign-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddCampaign(form);
            });
        }
    }

    async handleAddCampaign(form) {
        const campaignName = document.getElementById('campaign-name').value;
        const platform = document.getElementById('campaign-platform').value;
        const budget = parseFloat(document.getElementById('campaign-budget').value);
        const startDate = document.getElementById('campaign-start-date').value;
        const endDate = document.getElementById('campaign-end-date').value;
        const objective = document.getElementById('campaign-objective').value;
        const description = document.getElementById('campaign-description').value;

        try {
            const { data, error } = await window.app.dbClient
                .from('campaigns')
                .insert([
                    {
                        campaign_name: campaignName,
                        platform: platform,
                        budget: budget,
                        start_date: startDate,
                        end_date: endDate || null,
                        objective: objective,
                        description: description,
                        status: 'pending'
                    }
                ]);

            if (error) {
                console.error('Error adding campaign:', error);
                showNotification('خطأ في إنشاء الحملة', 'error');
                return;
            }

            showNotification('تم إنشاء الحملة بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadCampaigns();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error adding campaign:', error);
            showNotification('خطأ في إنشاء الحملة', 'error');
        }
    }

    async viewCampaign(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        const modalContent = `
            <h2>تفاصيل الحملة: ${campaign.campaign_name}</h2>
            <div class="campaign-details">
                <p><strong>المنصة:</strong> ${campaign.platform}</p>
                <p><strong>الميزانية:</strong> ${formatCurrency(campaign.budget)}</p>
                <p><strong>الحالة:</strong> <span class="status-badge status-${campaign.status}">${this.getStatusText(campaign.status)}</span></p>
                <p><strong>تاريخ البداية:</strong> ${formatDate(campaign.start_date)}</p>
                ${campaign.end_date ? `<p><strong>تاريخ النهاية:</strong> ${formatDate(campaign.end_date)}</p>` : ''}
                <p><strong>هدف الحملة:</strong> ${this.getObjectiveText(campaign.objective)}</p>
                ${campaign.description ? `<p><strong>الوصف:</strong> ${campaign.description}</p>` : ''}
                <p><strong>تاريخ الإنشاء:</strong> ${formatDate(campaign.created_at)}</p>
            </div>
        `;

        window.app.managers.modal.show(modalContent);
    }

    async editCampaign(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        const modalContent = `
            <h2>تعديل الحملة: ${campaign.campaign_name}</h2>
            <form id="edit-campaign-form">
                <div class="form-group">
                    <label for="edit-campaign-status">الحالة</label>
                    <select id="edit-campaign-status" required>
                        <option value="pending" ${campaign.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                        <option value="active" ${campaign.status === 'active' ? 'selected' : ''}>نشط</option>
                        <option value="paused" ${campaign.status === 'paused' ? 'selected' : ''}>متوقف</option>
                        <option value="completed" ${campaign.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                        <option value="cancelled" ${campaign.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-campaign-budget">الميزانية (جنيه مصري)</label>
                    <input type="number" id="edit-campaign-budget" required min="0" step="0.01" value="${campaign.budget}">
                </div>
                <div class="form-group">
                    <label for="edit-campaign-end-date">تاريخ النهاية</label>
                    <input type="date" id="edit-campaign-end-date" value="${campaign.end_date || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-campaign-description">وصف الحملة</label>
                    <textarea id="edit-campaign-description">${campaign.description || ''}</textarea>
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
        this.bindEditCampaignForm(campaignId);
    }

    bindEditCampaignForm(campaignId) {
        const form = document.getElementById('edit-campaign-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEditCampaign(campaignId, form);
            });
        }
    }

    async handleEditCampaign(campaignId, form) {
        const status = document.getElementById('edit-campaign-status').value;
        const budget = parseFloat(document.getElementById('edit-campaign-budget').value);
        const endDate = document.getElementById('edit-campaign-end-date').value;
        const description = document.getElementById('edit-campaign-description').value;

        try {
            const { error } = await window.app.dbClient
                .from('campaigns')
                .update({
                    status: status,
                    budget: budget,
                    end_date: endDate || null,
                    description: description
                })
                .eq('id', campaignId);

            if (error) {
                console.error('Error updating campaign:', error);
                showNotification('خطأ في تحديث الحملة', 'error');
                return;
            }

            showNotification('تم تحديث الحملة بنجاح', 'success');
            window.app.managers.modal.hide();
            await this.loadCampaigns();
            await window.app.managers.dashboard.refreshStats();
        } catch (error) {
            console.error('Error updating campaign:', error);
            showNotification('خطأ في تحديث الحملة', 'error');
        }
    }

    getObjectiveText(objective) {
        const objectiveMap = {
            'brand_awareness': 'زيادة الوعي بالعلامة التجارية',
            'traffic': 'زيادة الزيارات',
            'engagement': 'زيادة التفاعل',
            'leads': 'جذب العملاء المحتملين',
            'conversions': 'زيادة المبيعات',
            'app_installs': 'تحميل التطبيق'
        };
        return objectiveMap[objective] || objective;
    }

    onSectionShow() {
        this.loadCampaigns();
    }
}