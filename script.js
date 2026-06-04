const dbName = "MegaMediaDB";
const dbVersion = 1;
let db;

const uploadForm = document.getElementById('uploadForm');
const mediaContainer = document.getElementById('mediaContainer');
const mediaFileInput = document.getElementById('mediaFile');
const fileSelectedName = document.getElementById('fileSelectedName');

// HIỂN THỊ TÊN FILE KHI NGƯỜI DÙNG CHỌN
mediaFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        // Tính toán định dạng size rút gọn (MB hoặc GB)
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        fileSelectedName.innerHTML = `✅ Đã chọn: <strong>${file.name}</strong> (${fileSizeMB} MB)`;
    } else {
        fileSelectedName.innerText = "";
    }
});

// XIN QUYỀN LƯU TRỮ DUNG LƯỢNG LỚN VĨNH VIỄN
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        if (granted) console.log("Hạn ngạch lưu trữ mở rộng đã sẵn sàng.");
    });
}

// KHỞI TẠO CƠ SỞ DỮ LIỆU INDEXEDDB
const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = function(e) {
    db = e.target.result;
    loadMediaFromDB();
};

request.onerror = function(e) {
    console.error("Lỗi kết nối cơ sở dữ liệu:", e.target.error);
};

// TẢI FILE TỪ BỘ NHỚ LÊN GIAO DIỆN KHÔNG GIAN
function loadMediaFromDB() {
    if (!db) return;
    
    const transaction = db.transaction(["media"], "readonly");
    const store = transaction.objectStore("media");
    const requestGetAll = store.getAll();

    requestGetAll.onsuccess = function() {
        const savedMedia = requestGetAll.result;
        if (savedMedia.length > 0) {
            const noVideoMsg = document.querySelector('.no-video');
            if (noVideoMsg) noVideoMsg.remove();

            // Hiển thị lần lượt các file đã lưu (Đưa dữ liệu mới lên trên đầu)
            savedMedia.forEach(item => {
                const mediaURL = URL.createObjectURL(item.fileBlob);
                createMediaCard(item.title, mediaURL, item.fileName, item.fileBlob.type);
            });
        }
    };
}

// XỬ LÝ SỰ KIỆN ĐĂNG FILE CỦA NGƯỜI DÙNG
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const titleInput = document.getElementById('mediaTitle');
    const file = mediaFileInput.files[0];
    const title = titleInput.value;

    if (file) {
        // Chặn nếu vượt định mức bảo mật dữ liệu 2GB
        const maxSizeBytes = 2 * 1024 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            alert("Rất tiếc! Hệ thống chỉ xử lý file tối đa là 2GB nhằm đảm bảo an toàn hệ thống.");
            return;
        }

        const noVideoMsg = document.querySelector('.no-video');
        if (noVideoMsg) noVideoMsg.remove();

        // Tạo luồng phát trực tiếp (Stream) hiển thị tức thì không tốn bộ nhớ đệm RAM
        const tempURL = URL.createObjectURL(file);
        createMediaCard(title, tempURL, file.name, file.type);

        // Đẩy file thẳng vào bộ nhớ máy
        saveMediaToDB(title, file);

        // Làm sạch form
        uploadForm.reset();
        fileSelectedName.innerText = "";
    }
});

// HÀM XÂY DỰNG KHUNG GIAO DIỆN MEDIA CARD
function createMediaCard(title, mediaUrl, fileName, fileType) {
    const mediaCard = document.createElement('div');
    mediaCard.classList.add('video-card');

    let mediaTag = '';

    if (fileType.startsWith('image/')) {
        mediaTag = `<img src="${mediaUrl}" alt="${title}">`;
    } else if (fileType.startsWith('video/')) {
        mediaTag = `
            <video controls preload="metadata">
                <source src="${mediaUrl}" type="${fileType}">
                Trình duyệt của bạn không hỗ trợ định dạng này.
            </video>
        `;
    } else {
        mediaTag = `<p style="color: #ff4a4a; padding: 10px 0;">Định dạng tập tin này không được hỗ trợ phát trực tiếp!</p>`;
    }

    mediaCard.innerHTML = `
        <h3>${title}</h3>
        ${mediaTag}
        <a href="${mediaUrl}" download="${fileName}" class="btn-download">
            📥 Tải xuống thiết bị
        </a>
    `;

    // Chèn phần tử mới vào vị trí cao nhất trên thanh dòng thời gian
    mediaContainer.insertBefore(mediaCard, mediaContainer.firstChild);
}

// LƯU TRỮ CHẶN ĐƠ FILE VÀO TRÌNH DUYỆT ĐÍCH
function saveMediaToDB(title, fileBlob) {
    if (!db) return;

    const transaction = db.transaction(["media"], "readwrite");
    const store = transaction.objectStore("media");

    const mediaData = {
        title: title,
        fileBlob: fileBlob,
        fileName: fileBlob.name,
        timestamp: Date.now()
    };

    const addRequest = store.add(mediaData);

    addRequest.onsuccess = function() {
        console.log(`Lưu trữ vĩnh viễn thành công: ${fileBlob.name}`);
    };

    addRequest.onerror = function(e) {
        console.error("Gặp lỗi trong quá trình lưu tệp tin:", e.target.error);
        alert("Không đủ không gian trống trên thiết bị để lưu trữ dữ liệu này.");
    };
}
