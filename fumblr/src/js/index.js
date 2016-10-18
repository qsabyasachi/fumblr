import axios from 'axios';

(function() {
    // View messages
    $('.message-user').on('click', openUserMessages);
    function openUserMessages(e) {
        const user = $(this).addClass('selected').data('user');
        $(`.message-user[data-user!='${user}']`).removeClass('selected');
        $(`.user-messages[data-user!='${user}']`).addClass('hide');
        const msgList = $(`.user-messages[data-user='${user}']`).removeClass('hide');
    }

    // Check browser compatibility for form support
    const isAdvancedUpload = function() {
      const div = document.createElement('div');
      return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) 
        && 'FormData' in window && 'FileReader' in window;
    }();
    
    // Comment modal
    $('.comment-btn').on('click', openCommentModal);
    function openCommentModal() {
        const post = $(this).data('post');

        const $cmtModal = $('#comment-modal');
              $cmtModal.find('.comment-form').data('post', post);
              $cmtModal.find('.comment-text').val('');

        $cmtModal.modal('show');
    }

    $('.comment-form').on('submit', sendComment);
    function sendComment(e) {
        e.preventDefault();
        
        const $cmtModal = $('#comment-modal');
        const $form = $cmtModal.find('.comment-form');
        const post = $form.data('post');
        const text = $form.find('.comment-text').val();

        axios.post('/comment', {
            post, 
            text
        }).then(res => {
            console.log(res);
            $cmtModal.modal('hide');
        }).catch(err => {
            console.log(err);
        });
    }

    // Message modal
    $('.msg-btn').on('click', openMsgModal);
    function openMsgModal() {
        const user = $(this).data('user');

        const $msgModal = $('#message-modal');
              $msgModal.find('.message-form').data('user', user);
              $msgModal.find('.message-text').val('');

        $msgModal.modal('show');
    }

    // Send message
    $('.message-form').on('submit', sendMessage);
    function sendMessage(e) {
        e.preventDefault();
        
        const $msgModal = $('#message-modal');
        const $form = $msgModal.find('.message-form');
        const user = $form.data('user');
        const text = $form.find('.message-text').val();

        axios.post('/message', {
            user, 
            text
        }).then(res => {
            console.log(res);
            $msgModal.modal('hide');

        }).catch(err => {
            console.log(err);
        });
    }

    // Post Button
    $('.post-btn').on('click', openUploadModal);

    // Edit Button
    $('.edit-btn').on('click', editPost);

    function editPost() {
        const postID = $(this).data('post');
        
        axios.get(`/post/edit/${postID}`)
        .then(res => {
            const post = JSON.parse(res.data.post);
            openEditModal(post);
        })
        .catch(err => {
            console.log(err)
        });
    }

    // Open post modal for uploading
    function openUploadModal() {
        const $postModal = $('#post-modal');
              $postModal.find('.post-form').data('action', `/post`);
              $postModal.find('.modal-title').text('New Post');
              $postModal.find('.submit-btn').text('Submit');
              $postModal.find('.text').val('');
              $postModal.find('.tags').val('');
              $postModal.find('.file').val('');
              $postModal.find('.url').val('');
              $postModal.find('.preview').empty();

        openPostModal();
    }

    // Open post modal for editing
    function openEditModal(post) {
        const $postModal = $('#post-modal');
              $postModal.find('.post-form').data('action', `/post/edit/${post.id}`);
              $postModal.find('.modal-title').text('Edit Post');
              $postModal.find('.submit-btn').text('Save Changes');
              $postModal.find('.text').val(post.text);
              $postModal.find('.tags').val(post.tags.join(', '));
              $postModal.find('.file').val('');
              $postModal.find('.url').val('');
        
        const $preview = $postModal.find('.preview');
              $preview.empty();
     
        openPostModal(post.images);
    }
    
    // Post modal
    function openPostModal(images) {
        const $postModal = $('#post-modal');

        const $form = $postModal.find('.post-form');
        const $text = $postModal.find('.text');
        const $tags = $postModal.find('.tags');
        const $preview = $postModal.find('.preview');
        const $url = $postModal.find('.url');
              $url.on('input', e => {
                uploadImageURL($url.val());
              });
        const $file = $postModal.find('.file');
              $file.change(e => {
                    handleFiles(e.currentTarget.files);
                });
        const $submitBtn = $postModal.find('.submit-btn');
              $submitBtn.on('click', submit);
        
        const $droparea = $postModal.find('.droparea');
        const $dropbox = $postModal.find('.dropbox');
              $dropbox.on('dragenter', dragenter);
              $dropbox.on('dragover', dragover);
              $dropbox.on('dragleave', dragleave);
              $dropbox.on('drop', drop);

        const $switchBtn = $postModal.find('.switch-input');
              $switchBtn.on('click', switchInputs);

        const formData = new FormData();

        // If editing, add post's images and add them to formData
        if (images) {
            images.forEach(image => {
                addImage(image.link, `image-${image.id}`);
                formData.set(`image-${image.id}`, `${image.id}`);
            });
        }

        hideLoading();
        $postModal.modal('show');
        
        function addImage(image, id) {
            $(`
                <div class="image" data-id="${id}">
                    <button type="button" class="remove" data-id="${id}">&times;</button>
                    <img src="${image}" />
                </div>
            `).appendTo($preview);
            $postModal.find('.remove').on('click', removeImage);
        }

        function removeImage() {
            const imageID = $(this).data('id');
            formData.delete(`${imageID}`);
            $preview.find(`.image[data-id='${imageID}']`).remove();
        }

        function uploadImageURL(url) {
            if (!$url.val()) return;
            
            $url.val('');
            showLoading();
            axios.post('/image/url', {
                url
            }).then(res => {
                const image = res.data.image;
                addImage(image.link, `image-${image.id}`);
                formData.set(`image-${image.id}`, `${image.id}`);
                hideLoading();
            }).catch(err => {
                hideLoading();
                console.log(err.response.data);
            });
        }

        function handleFiles(files) {
            $.each( files, (i, f) => {
                const imageID = hashCode(f.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    addImage(e.target.result, imageID);
                };

                reader.readAsDataURL(f);
             
                formData.set(`${imageID}`, f);
            });

            $file.val('');
        }

        function submit() {
            if ($form.hasClass('is-uploading')) return false;

            $form.addClass('is-uploading');
            showLoading();

            formData.set('text', $text.val());
            formData.set('tags', $tags.val());

            const url = $postModal.find('.post-form').data('action');
            axios.post(url, formData)
            .then( res => {
                $form.removeClass('is-uploading');
                hideLoading();
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

        function switchInputs() {
            $postModal.find('.url-upload').toggleClass('hide');
            $postModal.find('.file-upload').toggleClass('hide');
            if ($postModal.find('.url-upload').hasClass('hide')) {
                $switchBtn.text('Upload photo by URL');
            } else {
                $switchBtn.text('Upload photo from file');
            }
        }

        function showLoading() {
            $postModal.find('.loading').removeClass('hide');
        }

        function hideLoading() {
            $postModal.find('.loading').addClass('hide');
        }

        function drop(e) {
            e.stopPropagation();
            e.preventDefault();

            const files = e.originalEvent.dataTransfer.files;
            handleFiles(files);
        }

        function dragenter(e) {
            e.stopPropagation();
            e.preventDefault();
            $droparea.addClass('dragover');
        }

        function dragleave(e) {
            e.stopPropagation();
            e.preventDefault();
            $droparea.removeClass('dragover');
        }

        function dragover(e) {
            e.stopPropagation();
            e.preventDefault();
        }
    }

    // Confirmation modal
    function askConfirm({ text='Are you sure you want to do that?', title='Are you sure?', btn='Confirm' }) {
        return new Promise(function(resolve, reject){
            const $confirmModal = $('#confirm-modal');
            if (!!$confirmModal) {
                $confirmModal.find('.modal-title').text(title);
                $confirmModal.find('#text').text(text);
                
                const $submitBtn = $confirmModal.find('#submit-btn');
                $submitBtn.text(btn);
                $submitBtn.on('click', resolve);

                const cancelBtn = $confirmModal.find('#cancel-btn');
                cancelBtn.on('click', reject);

                $confirmModal.modal({
                    backdrop: 'static',
                    keyboard: false
                });
            } else {
                reject('No confirm modal found');
            }   
        });      
    }

    // Delete button
    const $deleteBtn = $('.delete-btn');
    if (!!$deleteBtn) {
        $deleteBtn.on('click', (e) => {
            const btn = e.currentTarget;
            const postID = btn.dataset.post;

            askConfirm({ title: 'Delete post?', btn: 'Delete' })
            .then(() => {
                axios.get(`/post/delete/${postID}`)
                .then(res => {
                    document.location.reload(true);
                })
                .catch(err => {
                    console.log(err);
                });
            }).catch(() => {
                console.log('delete cancelled');
            });
        });
    }

    // Follow button
    const followButtons = document.querySelectorAll('.follow-btn');
    if (!!followButtons) {
        followButtons.forEach(btn => {
            btn.addEventListener('click', followUser);
        });
    }
    function followUser(e) {
        const btn = e.currentTarget;
        const user = btn.dataset.user;

        axios.post('/follow', {
            user
        }).then(res => {
            btn.classList.toggle('following')
        }).catch(err => {
            console.log(err);
        });
    }

    // Like buttons
    const likeButtons = document.querySelectorAll('.like-btn');
    if (!!likeButtons) {
        likeButtons.forEach( btn => {
            btn.addEventListener('click', likePost);
        });
    }

    function likePost(e) {
        const btn = e.currentTarget;
        const postID = btn.dataset.post;

        axios.post('/like', {
            post: postID
        }).then(res => {
            btn.classList.toggle('liked');
        }).catch(err => {
            console.log(err);
        });
    }

    // Reblog button
    $('.reblog-btn').on('click', reblogPost);
    function reblogPost(e) {
        const postID = $(this).data('post');

        axios.get(`/reblog/${postID}`)
        .then(res => {
            const post = JSON.parse(res.data.post);
            openReblogModal(post);
        })
        .catch(err => {
            console.log(err);
        });
    }

    function openReblogModal(post) {
        const $reblogModal = $('#reblog-modal');
              $reblogModal.find('.reblog-form').attr('action', `/reblog/${post.id}`);
              $reblogModal.find('.text').val('');
              $reblogModal.find('.tags').val('');
        const $preview = $reblogModal.find('.preview');
              $preview.empty();

        post.images.forEach(image => {
            $('<img class="image" />').attr('src', image.link).appendTo($preview);
        });
        $reblogModal.modal('show');
    }

    // Mobile header-sidebar
    $('.menu-btn, .mask').on('click', openSidemenu);
    function openSidemenu(e) {
        $('#header-sidebar').toggleClass('open');
        $('.menu-btn').toggleClass('fa-bars').toggleClass('fa-close');
    }

    // Utils
    function hashCode(str) {
        let hash = 0;
        if (str.length == 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}());