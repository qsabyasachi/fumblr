import axios from 'axios';
import { hashCode } from './utils';

export default class PostModal {
    init() {
        $('.post-btn').on('click', this.initUploadModal);
        $('.edit-btn').on('click', this.getEditPost.bind(this));

        this.$postModal = $('#post-modal');  
        this.$postForm = this.$postModal.find('.post-form');
        this.$modalTitle = this.$postModal.find('.modal-title');
        this.$submitBtn = this.$postModal.find('.submit-btn');
        this.$text = this.$postModal.find('.text');
        this.$tags = this.$postModal.find('.tags');
        this.$file = this.$postModal.find('.file');
        this.$url = this.$postModal.find('.url');
        this.$preview = this.$postModal.find('.preview');

        this.$url.on('input', e => {
            this.uploadImageURL(this.$url.val()).bind(this);
        });
        this.$file.change(e => {
            this.handleFiles(e.currentTarget.files);
        });
        this.$submitBtn.on('click', this.submit.bind(this));
    
        this.$droparea = this.$postModal.find('.droparea');
        this.$dropbox = this.$postModal.find('.dropbox');
        this.$dropbox
            .on('dragenter', this.dragenter.bind(this))
            .on('dragover', this.dragover.bind(this))
            .on('dragleave', this.dragleave.bind(this))
            .on('drop', this.drop);
          
        this.$switchBtn = this.$postModal.find('.switch-input');
        this.$switchBtn.on('click', this.switchInputs.bind(this));

        this.formData = new FormData();
    }

    initUploadModal() {
        this.clearModal();

        this.$postForm.data('action', `/post`);
        this.$modalTitle.text('New Post');
        this.$submitBtn.text('Submit');
            
        this.openModal();
    }

    initEditModal(post) {
        this.clearModal();

        this.$postForm.data('action', `/post/edit/${post.id}`);
        this.$modalTitle.text('Edit Post');
        this.$submitBtn.text('Save Changes');
        this.$text.val(post.text);
        this.$tags.val(post.tags.join(', '));

        post.images.forEach(image => {
            this.addImage(image.link, `image-${image.id}`);
            this.formData.set(`image-${image.id}`, `${image.id}`);
        });

        this.openModal();
    }

    submit() {
        if ($('.parsley-error').length !== 0) {
            console.log('Cannot submit invalid form');
            return false;
        }

        if (this.$postForm.hasClass('is-uploading')) return false;

        this.$postForm.addClass('is-uploading');
        this.showLoading();

        this.formData.set('text', this.$text.val());
        this.formData.set('tags', this.$tags.val());

        const url = this.$postForm.data('action');
        axios.post(url, this.formData)
        .then( res => {
            this.$postForm.removeClass('is-uploading');
            this.hideLoading();
            if (res.data.reload) {
                document.location.reload(true);
            } else if (res.data.redirect) {
                document.location.assign(res.data.redirect);
            }
        })
        .catch( err => {
            console.log(err);
        });
    }

    initValidation() {
        this.$postForm.parsley();
    }

    handleFiles(files) {
        $.each(files, (i, f) => {
            const imageID = hashCode(f.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addImage(e.target.result, imageID);
            };

            reader.readAsDataURL(f);
         
            this.formData.set(`${imageID}`, f);
        });

        this.$file.val('');
    }

    uploadImageURL(url) {
        if (!this.$url.val()) return;
        
        this.$url.val('');
        this.showLoading();
        axios.post('/image/url', {
            url
        }).then(res => {
            const image = res.data.image;
            this.addImage(image.link, `image-${image.id}`);
            this.formData.set(`image-${image.id}`, `${image.id}`);
            this.hideLoading();
        }).catch(err => {
            this.hideLoading();
            console.log(err.response.data);
        });
    }

    addImage(image, id) {
        $(`
            <div class="image" data-id="${id}">
                <button type="button" class="remove" data-id="${id}">&times;</button>
                <img src="${image}" />
            </div>
        `).appendTo(this.$preview);
        this.$postModal.find('.remove').on('click', this.removeImage.bind(this));
    }

    removeImage(e) {
        const imageID = $(e.currentTarget).data('id');
        this.formData.delete(`${imageID}`);
        this.$preview.find(`.image[data-id='${imageID}']`).remove();
    }

    showLoading() {
        this.$postModal.find('.loading').removeClass('hide');
    }

    hideLoading() {
        this.$postModal.find('.loading').addClass('hide');
    }

    openModal() {
        this.initValidation();
        this.$postModal.modal('show');
    }

    clearModal() {
        this.$text.val('');
        this.$tags.val('');
        this.$tags.val('');
        this.$url.val('');
        this.$preview.empty();
        this.formData = new FormData();
        this.hideLoading();
    }

    getEditPost(e) {
        const postID = $(e.currentTarget).data('post');
    
        axios.get(`/post/edit/${postID}`)
        .then(res => {
            const post = JSON.parse(res.data.post);
            this.initEditModal(post);
        })
        .catch(err => {
            console.log(err)
        });
    }

    switchInputs() {
        this.$postModal.find('.url-upload').toggleClass('hide');
        this.$postModal.find('.file-upload').toggleClass('hide');
        if (this.$postModal.find('.url-upload').hasClass('hide')) {
            this.$switchBtn.text('Upload photo by URL');
        } else {
            this.$switchBtn.text('Upload photo from file');
        }
    }

    drop(e) {
        e.stopPropagation();
        e.preventDefault();

        const files = e.originalEvent.dataTransfer.files;
        this.handleFiles(files);
    }

    dragenter(e) {
        e.stopPropagation();
        e.preventDefault();
        this.$droparea.addClass('dragover');
    }

    dragleave(e) {
        e.stopPropagation();
        e.preventDefault();
        this.$droparea.removeClass('dragover');
    }

    dragover(e) {
        e.stopPropagation();
        e.preventDefault();
    }
}