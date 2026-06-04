// điền thông tin dự án Supabase của bạn vào đây
const SUPABASE_URL = "https://omnmxjfodzwkjmssccvl.supabase.co/rest/v1/"; 
const SUPABASE_KEY = "sb_publishable_Q1HQeVw-ZQYQWvNdsqBcBg_NciCYri-";

// Khởi tạo kết nối đám mây
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const uploadForm = document.getElementById('uploadForm');
const mediaContainer = document.getElementById('mediaContainer');
const mediaFileInput = document.getElementById('mediaFile');
const fileSelectedName = document.getElementById('fileSelectedName');

// Hiển thị tên file và dung lượng khi chọn
mediaFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        fileSelectedName.innerHTML = `✅ Đã chọn: <strong>${file.name}</strong> (${fileSizeGB} GB)`;
    }
});

// Khi người dùng bấm ĐĂNG VIDEO
uploadForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const titleInput = document.getElementById('mediaTitle');
    const file = mediaFileInput.files[0];
    const title = titleInput.value;

    if (!file) return;

    // Đổi nút bấm thành trạng thái đang tải lên
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerText = "⏳ Đang tải lên đám mây... Vui lòng đợi...";
    submitBtn.disabled = true;

    // Tạo một cái tên file duy nhất trên mạng để không bị trùng
    const fileExtension = file.name.split('.').pop();
    const fileNameOnCloud = `${Date.now()}.${fileExtension}`;

    try {
        // TẢI FILE THẲNG LÊN MẠNG (Không lưu vào bộ nhớ máy nữa)
        const { data, error } = await supabase.storage
            .from('videos') // Tên bucket bạn tạo trên Supabase
            .upload(fileNameOnCloud, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Lấy đường link công khai của file sau khi up thành công
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileNameOnCloud);

        // Hiển thị video lên màn hình từ đường link mạng đó
        createMediaCard(title, publicUrl, file.name, file.type);
        
        alert("🎉 Đăng thành công video dung lượng lớn lên mạng!");

    } catch (error) {
        console.error(error);
        alert("Lỗi tải lên: " + error.message);
    } finally {
        // Trả lại trạng thái nút bấm ban đầu
        submitBtn.innerText = "Đăng lên không gian";
        submitBtn.disabled = false;
        uploadForm.reset();
        fileSelectedName.innerText = "";
    }
});

// Hàm tạo khung giao diện hiển thị video bằng link mạng
function createMediaCard(title, mediaUrl, fileName, fileType) {
    const noVideoMsg = document.querySelector('.no-video');
    if (noVideoMsg) noVideoMsg.remove();

    const mediaCard = document.createElement('div');
    mediaCard.classList.add('video-card');

    let mediaTag = fileType.startsWith('image/') 
        ? `<img src="${mediaUrl}" alt="${title}">`
        : `<video controls preload="metadata"><source src="${mediaUrl}" type="${fileType}">Trình duyệt không hỗ trợ.</video>`;

    mediaCard.innerHTML = `
        <h3>${title}</h3>
        ${mediaTag}
        <a href="${mediaUrl}" download="${fileName}" class="btn-download" target="_blank">
            📥 Tải xuống thiết bị
        </a>
    `;

    mediaContainer.insertBefore(mediaCard, mediaContainer.firstChild);
}
