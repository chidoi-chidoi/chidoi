const uploadForm = document.getElementById('uploadForm');
const videoContainer = document.getElementById('videoContainer');

// 1. TỰ ĐỘNG HIỂN THỊ CÁC VIDEO ĐÃ LƯU KHI MỞ TRANG WEB
document.addEventListener('DOMContentLoaded', loadVideosFromStorage);

function loadVideosFromStorage() {
    // Lấy danh sách video từ LocalStorage (nếu có)
    const savedVideos = JSON.parse(localStorage.getItem('myVideos')) || [];

    if (savedVideos.length > 0) {
        // Xóa dòng chữ thông báo trống
        const noVideoMsg = document.querySelector('.no-video');
        if (noVideoMsg) noVideoMsg.remove();

        // Duyệt qua từng video đã lưu và hiển thị ra màn hình
        savedVideos.forEach(video => {
            createVideoCard(video.title, video.dataUrl, video.fileName, video.type);
        });
    }
}

// 2. XỬ LÝ KHI NGƯỜI DÙNG BẤM ĐĂNG VIDEO MỚI
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const titleInput = document.getElementById('videoTitle');
    const fileInput = document.getElementById('videoFile');

    const file = fileInput.files[0];
    const title = titleInput.value;

    if (file) {
        const reader = new FileReader();

        // Đọc file video và chuyển thành chuỗi DataURL (Base64) để lưu trữ
        reader.onload = function(event) {
            const videoDataUrl = event.target.result;
            const fileName = file.name;
            const fileType = file.type;

            // Xóa dòng chữ thông báo trống "Chưa có video nào"
            const noVideoMsg = document.querySelector('.no-video');
            if (noVideoMsg) noVideoMsg.remove();

            // Hiển thị video mới lên màn hình
            createVideoCard(title, videoDataUrl, fileName, fileType);

            // Lưu video mới này vào bộ nhớ LocalStorage
            saveVideoToStorage(title, videoDataUrl, fileName, fileType);

            // Reset form nhập liệu
            uploadForm.reset();
        };

        // Bắt đầu đọc file
        reader.readAsDataURL(file);
    }
});

// 3. HÀM TẠO GIAO DIỆN HIỂN THỊ VIDEO
function createVideoCard(title, dataUrl, fileName, fileType) {
    const videoCard = document.createElement('div');
    videoCard.classList.add('video-card');

    videoCard.innerHTML = `
        <h3>${title}</h3>
        <video controls>
            <source src="${dataUrl}" type="${fileType}">
            Trình duyệt của bạn không hỗ trợ xem video này.
        </video>
        <a href="${dataUrl}" download="${fileName}" class="btn-download">
            📥 Tải video xuống
        </a>
    `;

    // Đẩy video mới/video cũ lên đầu danh sách
    videoContainer.insertBefore(videoCard, videoContainer.firstChild);
}

// 4. HÀM LƯU DỮ LIỆU VÀO LOCALSTORAGE
function saveVideoToStorage(title, dataUrl, fileName, fileType) {
    const savedVideos = JSON.parse(localStorage.getItem('myVideos')) || [];
    
    // Thêm video mới vào mảng dữ liệu
    savedVideos.push({
        title: title,
        dataUrl: dataUrl,
        fileName: fileName,
        type: fileType
    });

    // Lưu lại mảng vào LocalStorage dưới dạng chuỗi JSON
    localStorage.setItem('myVideos', JSON.stringify(savedVideos));
}
