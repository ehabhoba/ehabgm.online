export class ModalManager {
    constructor() {
        this.modal = document.getElementById('modal');
        this.modalBody = document.getElementById('modal-body');
        this.closeBtn = this.modal?.querySelector('.close');
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'block') {
                this.hide();
            }
        });
    }

    show(content) {
        if (!this.modal || !this.modalBody) return;

        this.modalBody.innerHTML = content;
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Replace feather icons in modal content
        feather.replace();

        // Focus on first input if available
        const firstInput = this.modalBody.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hide() {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.modalBody.innerHTML = '';
    }
}