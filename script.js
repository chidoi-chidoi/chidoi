const uploadForm = document.getElementById('uploadForm');
const mediaContainer = document.getElementById('mediaContainer');

// 1. TỰ ĐỘNG HIỂN THỊ CÁC FILE ĐÃ LƯU KHI MỞ TRANG WEB
document.addEventListener('DOMContentLoaded', loadMediaFromStorage);

function loadMediaFromStorage() {
    const savedMedia = JSON.parse(localStorage.getItem('myMediaList')) || [];

    if (savedMedia.length > 0) {
        // Xóa dòng chữ thông báo trống
        const noVideoMsg = document.querySelector('.no-video');
        if (noVideoMsg) noVideoMsg.remove();

        // Duyệt qua từng file đã lưu và hiển thị ra màn hình
        savedMedia.forEach(item => {
            createMediaCard(item.title, item.dataUrl, item.fileName, item.type);
        });
    }
}

// 2. XỬ LÝ KHI NGƯỜI DÙNG BẤM ĐĂNG FILE MỚI
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const titleInput = document.getElementById('mediaTitle');
    const fileInput = document.getElementById('mediaFile');

    const file = fileInput.files[0];
    const title = titleInput.value;

    if (file) {
        const reader = new FileReader();

        // Đọc file và chuyển thành chuỗi mã hóa để lưu vào LocalStorage
        reader.onload = function(event) {
            const mediaDataUrl = event.target.result;
            const fileName = file.name;
            const fileType = file.type;

            // Xóa dòng chữ thông báo trống
            const noVideoMsg = document.querySelector('.no-video');
            if (noVideoMsg) noVideoMsg.remove();

            // Hiển thị file lên màn hình
            createMediaCard(title, mediaDataUrl, fileName, fileType);

            // Lưu file vào bộ nhớ LocalStorage
            saveMediaToStorage(title, mediaDataUrl, fileName, fileType);

            // Reset form nhập liệu
            uploadForm.reset();
        };

        // Bắt đầu đọc file dưới dạng DataURL
        reader.readAsDataURL(file);
    }
});

// 3. HÀM TẠO GIAO DIỆN HIỂN THỊ (TỰ ĐỘNG PHÂN BIỆT ẢNH VÀ VIDEO)
function createMediaCard(title, dataUrl, fileName, fileType) {
    const mediaCard = document.createElement('div');
    mediaCard.classList.add('video-card');

    let mediaTag = '';

    // Kiểm tra loại file để tạo thẻ HTML phù hợp
    if (fileType.startsWith('image/')) {
        // Nếu là ảnh, dùng thẻ <img>
        mediaTag = `<img src="${dataUrl}" alt="${title}">`;
    } else if (fileType.startsWith('video/')) {
        // Nếu là video, dùng thẻ <video> có kèm thanh điều khiển controls
        mediaTag = `
            <video controls>
                <source src="${dataUrl}" type="${fileType}">
                Trình duyệt của bạn không hỗ trợ xem video này.
            </video>
        `;
    } else {
        mediaTag = `<p style="color: red;">Định dạng file không hỗ trợ hiển thị!</p>`;
    }

    mediaCard.innerHTML = `
        <h3>${title}</h3>
        ${mediaTag}
        <a href="${dataUrl}" download="${fileName}" class="btn-download">
            📥 Tải xuống máy
        </a>
    `;

    // Đẩy nội dung mới lên đầu danh sách hiển thị
    mediaContainer.insertBefore(mediaCard, mediaContainer.firstChild);
}

// 4. HÀM LƯU DỮ LIỆU VÀO LOCALSTORAGE
function saveMediaToStorage(title, dataUrl, fileName, fileType) {
    const savedMedia = JSON.parse(localStorage.getItem('myMediaList')) || [];
    
    // Thêm đối tượng mới vào danh sách
    savedMedia.push({
        title: title,
        dataUrl: dataUrl,
        fileName: fileName,
        type: fileType
    });

    // Lưu lại vào LocalStorage dưới dạng chuỗi JSON
    try {
        localStorage.setItem('myMediaList', JSON.stringify(savedMedia));
    } catch (error) {
        alert("Bộ nhớ trình duyệt đã đầy! Vui lòng không tải file dung lượng quá lớn.");
        console.error("LocalStorage dung lượng đã vượt quá giới hạn:", error);
    }
        }
