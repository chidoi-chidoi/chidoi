const dbName = "MegaMediaDB";
const dbVersion = 1;
let db;

const uploadForm = document.getElementById('uploadForm');
const mediaContainer = document.getElementById('mediaContainer');

// 1. XIN QUYỀN TRÌNH DUYỆT ĐỂ LƯU FILE LỚN KHÔNG BỊ XÓA
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        if (granted) {
            console.log("Tuyệt vời! Trình duyệt đã cấp quyền lưu trữ dung lượng lớn vĩnh viễn.");
        } else {
            console.warn("Trình duyệt từ chối cấp quyền vĩnh viễn, việc lưu file >1GB có thể bị hạn chế tùy vào ổ cứng trống.");
        }
    });
}

// 2. KHỞI TẠO INDEXEDDB
const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = function(e) {
    db = e.target.result;
    console.log("Kết nối kho lưu trữ MegaMediaDB thành công!");
    loadMediaFromDB();
};

request.onerror = function(e) {
    console.error("Lỗi kết nối cơ sở dữ liệu:", e.target.error);
};

// 3. TẢI VÀ HIỂN THỊ FILE TỪ BỘ NHỚ
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

            // Hiển thị danh sách file
            savedMedia.forEach(item => {
                // Tạo URL trực tiếp từ Blob gốc giúp tiết kiệm RAM bộ nhớ
                const mediaURL = URL.createObjectURL(item.fileBlob);
                createMediaCard(item.title, mediaURL, item.fileName, item.fileBlob.type);
            });
        }
    };
}

// 4. XỬ LÝ KHI ĐĂNG FILE (TỐI ƯU CHO FILE ĐẾN 2GB)
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const titleInput = document.getElementById('mediaTitle');
    const fileInput = document.getElementById('mediaFile');

    const file = fileInput.files[0];
    const title = titleInput.value;

    if (file) {
        // Kiểm tra nếu file lớn hơn 2GB (2GB = 2 * 1024 * 1024 * 1024 bytes)
        const maxSizeBytes = 2 * 1024 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            alert("File quá lớn! Trang web chỉ hỗ trợ file tối đa là 2GB.");
            return;
        }

        const noVideoMsg = document.querySelector('.no-video');
        if (noVideoMsg) noVideoMsg.remove();

        // Hiển thị ngay lập tức bằng Object URL (Không tốn RAM đọc file)
        const tempURL = URL.createObjectURL(file);
        createMediaCard(title, tempURL, file.name, file.type);

        // Lưu trực tiếp vào IndexedDB
        saveMediaToDB(title, file);

        // Reset form
        uploadForm.reset();
    }
});

// 5. TẠO GIAO DIỆN HIỂN THỊ
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
                Trình duyệt của bạn không hỗ trợ xem video này.
            </video>
        `;
    } else {
        mediaTag = `<p style="color: red;">Định dạng không hỗ trợ!</p>`;
    }

    mediaCard.innerHTML = `
        <h3>${title}</h3>
        ${mediaTag}
        <a href="${mediaUrl}" download="${fileName}" class="btn-download">
            📥 Tải xuống máy (${(fileName)})
        </a>
    `;

    mediaContainer.insertBefore(mediaCard, mediaContainer.firstChild);
}

// 6. GHI FILE DUNG LƯỢNG LỚN VÀO INDEXEDDB
function saveMediaToDB(title, fileBlob) {
    if (!db) return;

    const transaction = db.transaction(["media"], "readwrite");
    const store = transaction.objectStore("media");

    const mediaData = {
        title: title,
        fileBlob: fileBlob, // Lưu trực tiếp con trỏ file, trình duyệt sẽ tự tối ưu ghi vào ổ cứng
        fileName: fileBlob.name,
        timestamp: Date.now()
    };

    const addRequest = store.add(mediaData);

    addRequest.onsuccess = function() {
        console.log(`Đã lưu thành công file vĩnh viễn: ${fileBlob.name}`);
    };

    addRequest.onerror = function(e) {
        console.error("Lưu file thất bại:", e.target.error);
        alert("Không thể lưu video này! Hãy đảm bảo ổ cứng máy tính của bạn còn trống gấp đôi dung lượng file cần tải lên.");
    };
}
