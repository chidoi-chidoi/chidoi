const uploadForm = document.getElementById('uploadForm');
const videoContainer = document.getElementById('videoContainer');

uploadForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Ngăn trang web bị reload

    const titleInput = document.getElementById('videoTitle');
    const fileInput = document.getElementById('videoFile');

    const file = fileInput.files[0];
    const title = titleInput.value;

    if (file) {
        // Tạo một đường dẫn tạm thời cho file video và lấy tên file gốc
        const videoURL = URL.createObjectURL(file);
        const fileName = file.name;

        // Xóa dòng chữ thông báo trống "Chưa có video nào"
        const noVideoMsg = document.querySelector('.no-video');
        if (noVideoMsg) {
            noVideoMsg.remove();
        }

        // Tạo khung (Card) chứa thông tin video và nút Tải xuống
        const videoCard = document.createElement('div');
        videoCard.classList.add('video-card');

        videoCard.innerHTML = `
            <h3>${title}</h3>
            <video controls>
                <source src="${videoURL}" type="${file.type}">
                Trình duyệt của bạn không hỗ trợ xem video này.
            </video>
            <a href="${videoURL}" download="${fileName}" class="btn-download">
                📥 Tải video xuống
            </a>
        `;

        // Đẩy video vừa tạo lên vị trí đầu tiên trong danh sách hiển thị
        videoContainer.insertBefore(videoCard, videoContainer.firstChild);

        // Làm sạch (Reset) form nhập liệu để chuẩn bị cho lần đăng tiếp theo
        uploadForm.reset();
    }
});

