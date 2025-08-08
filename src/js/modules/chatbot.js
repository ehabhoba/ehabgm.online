export class ChatbotManager {
    constructor() {
        this.chatBox = document.getElementById('chat-box');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.quickRepliesContainer = document.getElementById('quick-replies-container');
    }

    async init() {
        this.bindEvents();
        this.showWelcomeMessage();
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => {
            this.handleUserInput(this.chatInput.value);
        });

        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput(this.chatInput.value);
            }
        });
    }

    showWelcomeMessage() {
        setTimeout(() => {
            const welcomeMessage = "أهلاً بك يا مدير EhabGM! أنا مساعدك الذكي، جاهز لتنفيذ أوامرك.";
            this.addMessage(welcomeMessage, 'bot');
            this.showQuickReplies([
                "عرض الطلبات الجديدة",
                "كم عدد العملاء؟",
                "ملخص الحملات النشطة",
                "عرض الخدمات المتاحة"
            ]);
        }, 1000);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.innerHTML = text;
        
        messageDiv.appendChild(textDiv);
        this.chatBox.appendChild(messageDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('message', 'bot-message');
        indicator.innerHTML = `
            <div class="text typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        this.chatBox.appendChild(indicator);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        return indicator;
    }

    removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    showQuickReplies(replies) {
        this.quickRepliesContainer.innerHTML = '';
        if (!replies || replies.length === 0) return;

        const container = document.createElement('div');
        container.classList.add('quick-replies');

        replies.forEach(reply => {
            const button = document.createElement('button');
            button.classList.add('quick-reply-btn');
            button.textContent = reply;
            button.onclick = () => {
                this.handleUserInput(reply);
                this.quickRepliesContainer.innerHTML = '';
            };
            container.appendChild(button);
        });

        this.quickRepliesContainer.appendChild(container);
    }

    async handleUserInput(message) {
        if (!message.trim()) return;

        this.addMessage(message, 'user');
        this.chatInput.value = '';

        const typingIndicator = this.showTypingIndicator();
        
        try {
            const response = await this.generateBotResponse(message);
            
            setTimeout(() => {
                this.removeTypingIndicator(typingIndicator);
                this.addMessage(response.message, 'bot');
                if (response.quickReplies) {
                    this.showQuickReplies(response.quickReplies);
                }
            }, 1500);
        } catch (error) {
            this.removeTypingIndicator(typingIndicator);
            this.addMessage('عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.', 'bot');
        }
    }

    async generateBotResponse(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase().trim();
        let response = {
            message: "عفواً، لم أفهم الأمر. يمكنك تجربة أحد الأوامر المقترحة.",
            quickReplies: ["عرض الطلبات الجديدة", "كم عدد العملاء؟", "ملخص الحملات النشطة"]
        };

        try {
            if (lowerCaseMessage.includes('الطلبات الجديدة') || lowerCaseMessage.includes('الطلبات')) {
                const { data, error } = await window.app.dbClient
                    .from('orders')
                    .select(`
                        id, 
                        status, 
                        created_at,
                        users(name),
                        services(service_name)
                    `)
                    .eq('status', 'pending')
                    .limit(5);

                if (error || !data) {
                    response.message = "حدث خطأ أثناء جلب الطلبات.";
                } else if (data.length === 0) {
                    response.message = "لا توجد طلبات جديدة حالياً. 🎉";
                } else {
                    response.message = `لديك ${data.length} طلبات جديدة:<br><ul>`;
                    data.forEach(order => {
                        const clientName = order.users?.name || 'غير محدد';
                        const serviceName = order.services?.service_name || 'غير محدد';
                        response.message += `<li><b>الطلب #${order.id.substring(0, 8)}:</b> خدمة "${serviceName}" للعميل "${clientName}"</li>`;
                    });
                    response.message += "</ul>";
                    response.quickReplies = ["عرض جميع الطلبات", "إحصائيات العملاء", "الحملات النشطة"];
                }
            }
            else if (lowerCaseMessage.includes('عدد العملاء') || lowerCaseMessage.includes('العملاء')) {
                const { count, error } = await window.app.dbClient
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'client');

                if (error) {
                    response.message = "خطأ في جلب البيانات.";
                } else {
                    response.message = `إجمالي عدد العملاء المسجلين هو: <b>${count || 0}</b> عميل. 👥`;
                    response.quickReplies = ["عرض قائمة العملاء", "إضافة عميل جديد", "الطلبات الجديدة"];
                }
            }
            else if (lowerCaseMessage.includes('الحملات النشطة') || lowerCaseMessage.includes('الحملات')) {
                const { data, error } = await window.app.dbClient
                    .from('campaigns')
                    .select('id, campaign_name, platform, budget, status')
                    .eq('status', 'active')
                    .limit(5);

                if (error || !data) {
                    response.message = "حدث خطأ أثناء جلب الحملات.";
                } else if (data.length === 0) {
                    response.message = "لا توجد حملات نشطة حالياً. 📊";
                } else {
                    response.message = `يوجد ${data.length} حملات نشطة:<br><ul>`;
                    data.forEach(campaign => {
                        response.message += `<li><b>${campaign.campaign_name}:</b> على ${campaign.platform} بميزانية ${campaign.budget} جنيه</li>`;
                    });
                    response.message += "</ul>";
                    response.quickReplies = ["عرض جميع الحملات", "إنشاء حملة جديدة", "تقارير الحملات"];
                }
            }
            else if (lowerCaseMessage.includes('الخدمات') || lowerCaseMessage.includes('خدمة')) {
                const { data, error } = await window.app.dbClient
                    .from('services')
                    .select('service_name, price, description')
                    .limit(5);

                if (error || !data) {
                    response.message = "حدث خطأ أثناء جلب الخدمات.";
                } else if (data.length === 0) {
                    response.message = "لا توجد خدمات متاحة حالياً.";
                } else {
                    response.message = `الخدمات المتاحة (${data.length}):<br><ul>`;
                    data.forEach(service => {
                        response.message += `<li><b>${service.service_name}:</b> ${service.price} جنيه</li>`;
                    });
                    response.message += "</ul>";
                    response.quickReplies = ["عرض جميع الخدمات", "إضافة خدمة جديدة", "تعديل الأسعار"];
                }
            }
            else if (lowerCaseMessage.startsWith('ابحث عن العميل')) {
                const clientName = userMessage.replace('ابحث عن العميل', '').trim();
                const { data, error } = await window.app.dbClient
                    .from('users')
                    .select('*')
                    .ilike('name', `%${clientName}%`)
                    .eq('role', 'client')
                    .limit(1);

                if (error || data.length === 0) {
                    response.message = `لم يتم العثور على عميل بالاسم "${clientName}". 🔍`;
                } else {
                    const client = data[0];
                    response.message = `تم العثور على العميل:<br>
                                        <b>الاسم:</b> ${client.name}<br>
                                        <b>البريد الإلكتروني:</b> ${client.email}<br>
                                        <b>رقم الهاتف:</b> ${client.phone_number || 'غير محدد'}`;
                    response.quickReplies = ["طلبات هذا العميل", "تعديل بيانات العميل", "البحث عن عميل آخر"];
                }
            }
            else if (lowerCaseMessage.includes('مساعدة') || lowerCaseMessage.includes('help')) {
                response.message = `يمكنني مساعدتك في:<br>
                                   • عرض الطلبات الجديدة<br>
                                   • إحصائيات العملاء<br>
                                   • متابعة الحملات النشطة<br>
                                   • إدارة الخدمات<br>
                                   • البحث عن العملاء<br><br>
                                   اكتب أمرك أو اختر من الأزرار أدناه.`;
                response.quickReplies = ["عرض الطلبات الجديدة", "كم عدد العملاء؟", "الحملات النشطة", "الخدمات المتاحة"];
            }
        } catch (error) {
            console.error('Error in bot response:', error);
            response.message = "عذراً، حدث خطأ في معالجة طلبك.";
        }

        return response;
    }
}