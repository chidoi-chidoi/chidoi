const dbName = "MegaMediaDB";
const dbVersion = 1;
let db;

const uploadForm = document.getElementById('uploadForm');
const mediaContainer = document.getElementById('mediaContainer');
const mediaFileInput = document.getElementById('mediaFile');
const fileSelectedName = document.getElementById('fileSelectedName');

// XỬ LÝ SỰ KIỆN CHỌN FILE VÀ HIỂN THỊ TRẠNG THÁI
mediaFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        
        fileSelectedName.style.display = "block";
        fileSelectedName.innerHTML = `🌟 Đã chọn thành công: <strong>${file.name}</strong> (${fileSizeGB} GB)`;
    } else {
        fileSelectedName.style.display = "none";
        fileSelectedName.innerText = "";
    }
});

// YÊU CẦU TRÌNH DUYỆT CẤP HẠN NGẠCH LƯU TRỮ TỐI ĐA
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        if (granted) console.log("Hệ thống đã phê duyệt không gian lưu trữ mở rộng.");
    });
}

// KHỞI TẠO CƠ SỞ DỮ LIỆU CỤC BỘ INDEXEDDB
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
    console.error("Lỗi kết nối cơ sở dữ liệu nội bộ:", e.target.error);
};

// TẢI FILE TỪ BỘ NHỚ LÊN GIAO DIỆN KHI MỞ WEB
function loadMediaFromDB() {
    if (!db) return;
    
    const transaction = db.transaction(["media"], "readonly");
    const store = transaction.objectStore("media");
    const requestGetAll = store.getAll();

    requestGetAll.onsuccess = function() {
        const savedMedia = requestGetAll.result;
        if (savedMedia.length > 0) {
            // Xóa thông báo trống
            const noVideoMsg = document.querySelector('.no-video');
            if (noVideoMsg) noVideoMsg.remove();

            // Sắp xếp đưa file mới nhất lên đầu danh sách
            savedMedia.reverse().forEach(item => {
                const mediaURL = URL.createObjectURL(item.fileBlob);
                createMediaCard(item.title, mediaURL, item.fileName, item.fileBlob.type);
            });
        }
    };
}

// XỬ LÝ SỰ KIỆN KHI ẤN NÚT "ĐĂNG LÊN KHÔNG GIAN"
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const titleInput = document.getElementById('mediaTitle');
    const file = mediaFileInput.files[0];
    const title = titleInput.value;

    if (file) {
        // Xóa thông báo trống nếu có
        const noVideoMsg = document.querySelector('.no-video');
        if (noVideoMsg) noVideoMsg.remove();

        // Tạo đường dẫn tạm thời phát video siêu tốc tức thì
        const tempURL = URL.createObjectURL(file);
        
        // Đưa thẻ video mới nhất lên vị trí đầu tiên trong danh sách hiển thị
        createMediaCard(title, tempURL, file.name, file.type, true);

        // Lưu trữ vĩnh viễn tệp tin khổng lồ vào bộ nhớ thiết bị
        saveMediaToDB(title, file);

        // Khôi phục lại trạng thái form ban đầu
        uploadForm.reset();
        fileSelectedName.style.display = "none";
        fileSelectedName.innerText = "";
    }
});

// HÀM XÂY DỰNG KHUNG GIAO DIỆN MEDIA CARD
function createMediaCard(title, mediaUrl, fileName, fileType, isPrepend = false) {
    const mediaCard = document.createElement('div');
    mediaCard.classList.add('video-card');

    let mediaTag = '';

    if (fileType.startsWith('image/')) {
        mediaTag = `<img src="${mediaUrl}" alt="${title}">`;
    } else if (fileType.startsWith('video/')) {
        mediaTag = `
            <video controls preload="metadata">
                <source src="${mediaUrl}" type="${fileType}">
                Trình duyệt của bạn không hỗ trợ phát trực tiếp định dạng này.
            </video>
        `;
    } else {
        mediaTag = `<p style="color: #ff4a4a; padding: 10px 0;">Định dạng file không được hỗ trợ preview!</p>`;
    }

    mediaCard.innerHTML = `
        <h3>${title}</h3>
        ${mediaTag}
        <a href="${mediaUrl}" download="${fileName}" class="btn-download">
            📥 Tải xuống thiết bị
        </a>
    `;

    if (isPrepend) {
        mediaContainer.insertBefore(mediaCard, mediaContainer.firstChild);
    } else {
        mediaContainer.appendChild(mediaCard);
    }
}

// HÀM LƯU TRỮ DỮ LIỆU VÀO INDEXEDDB
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
        console.log(`Lưu trữ thành công file khổng lồ: ${fileBlob.name}`);
    };

    addRequest.onerror = function(e) {
        console.error("Gặp lỗi trong quá trình lưu tệp tin:", e.target.error);
        alert("Lưu ý: Không đủ không gian đĩa trống trên trình duyệt để ghi nhớ video dài này.");
    };
      }

