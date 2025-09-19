document.addEventListener('DOMContentLoaded', () => {
    
const sidebar = document.querySelector('.sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const overlay = document.querySelector('.overlay');

function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.contains('active') ? closeSidebar() : openSidebar();
    });
}

if (overlay) {
    overlay.addEventListener('click', closeSidebar);
}
const imageInputA = document.getElementById('image');
const imageInputB = document.getElementById('image_b');
const imagePreview = document.getElementById('imagePreview');

function updatePreview(input, type) {
    if (!imagePreview) return;

    // ค้นหาและลบ container ของพรีวิวเดิมสำหรับประเภทนั้นๆ
    const oldPreviewContainer = imagePreview.querySelector(`.preview-item[data-type="${type}"]`);
    if (oldPreviewContainer) oldPreviewContainer.remove();

    // สร้างพรีวิวใหม่
    if (input.files && input.files.length > 0) {
        const file = input.files[0];

        // สร้าง container สำหรับรูปและปุ่มลบ
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.setAttribute('data-type', type);

        // สร้าง element รูปภาพ
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'thumb';
        
        // สร้างปุ่มลบ
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-preview-btn';
        removeBtn.innerHTML = '&times;'; // เครื่องหมาย '×'
        removeBtn.type = 'button'; // ป้องกันการ submit ฟอร์ม

        // เพิ่ม event listener ให้ปุ่มลบ
        removeBtn.addEventListener('click', () => {
            previewItem.remove(); // ลบพรีวิวออกจากหน้าจอ
            input.value = ''; // **สำคัญมาก:** เคลียร์ค่าใน file input
        });

        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        imagePreview.appendChild(previewItem);
    }
}

if (imageInputA) {
    imageInputA.addEventListener('change', function() {
        updatePreview(this, 'front');
    });
}
if (imageInputB) {
    imageInputB.addEventListener('change', function() {
        updatePreview(this, 'back');
    });
}

    // --- การทำงานของ Card และปุ่ม Edit/Delete ---
    const setupCardInteractions = (card) => {
        const imageContainer = card.querySelector('.card-image-container');
        const cardContent = card.querySelector('.card-content');
        const editBtn = card.querySelector('.edit-btn');
        const deleteIconBtn = card.querySelector('.delete-icon-btn');
        const images = imageContainer.querySelectorAll('.card-image');
        const dots = imageContainer.querySelectorAll('.dot');
        
        // ซ่อนปุ่ม edit และ delete ในตอนแรก
        editBtn.classList.add('hidden');
        if (deleteIconBtn) deleteIconBtn.classList.add('hidden');

        // แสดงปุ่ม edit/delete เมื่อแตะที่ card content
        cardContent.addEventListener('click', (e) => {
            e.stopPropagation(); // หยุดการส่ง event ไปที่ parent
            editBtn.classList.remove('hidden');
            if (deleteIconBtn) deleteIconBtn.classList.remove('hidden');
        });

        // ซ่อนปุ่มเมื่อคลิกที่อื่นในหน้า
        document.body.addEventListener('click', (e) => {
            if (!card.contains(e.target)) {
                editBtn.classList.add('hidden');
                if (deleteIconBtn) deleteIconBtn.classList.add('hidden');
            }
        });

        // สลับรูปภาพเมื่อแตะที่รูป
        if (images.length > 1) {
            let currentIndex = 0;
            imageContainer.addEventListener('click', (e) => {
                e.stopPropagation(); // หยุดการส่ง event ไปที่ card content
                currentIndex = (currentIndex + 1) % images.length;
                updateImages();
                // ซ่อนปุ่ม delete เมื่อสลับรูป
                if (deleteIconBtn) deleteIconBtn.classList.add('hidden');
                // editBtn ไม่ต้องแตะต้อง
            });

            function updateImages() {
                images.forEach((img, index) => {
                    img.classList.toggle('active', index === currentIndex);
                });
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentIndex);
                });
            }
        }
    };

    document.querySelectorAll('.card').forEach(setupCardInteractions);
    
    // --- การทำงานของ Modal แก้ไข ---
    const editModal = document.getElementById('editModal');
    const modalContent = document.getElementById('modalContent');
    const editSkuDisplay = document.getElementById('editSkuDisplay');
    const editSkuInput = document.getElementById('editSku');
    const editSizeInputsContainer = document.getElementById('editSizeInputs');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];

    // เปิด Modal
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            const itemData = JSON.parse(card.dataset.item);
            
            editSkuDisplay.value = itemData.sku;
            editSkuInput.value = itemData.sku;

            editSizeInputsContainer.innerHTML = ''; // เคลียร์ input เก่า
            sizes.forEach(size => {
                const quantity = itemData.sizes[size] || 0;
                const div = document.createElement('div');
                div.className = `badge-input-group badge-input-${size}`;
                div.innerHTML = `
                    <label for="edit-${size}">${size.toUpperCase()}</label>
                    <select id="edit-${size}" name="${size}" class="size-select">
                        ${[...Array(13).keys()].map(i => `<option value="${i}" ${i === quantity ? 'selected' : ''}>${i}</option>`).join('')}
                    </select>
                `;
                editSizeInputsContainer.appendChild(div);
            });

            editModal.style.display = 'grid';
            modalContent.style.transform = 'translateY(0)';
        });
    });

    // ฟังเหตุการณ์การลบจากปุ่มไอคอน
    document.querySelectorAll('.delete-icon-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = button.closest('.card');
            const itemData = JSON.parse(card.dataset.item);
            const sku = itemData.sku;
            if (confirm(`ลบ SKU:${sku} ?`)) {
                 fetch('/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sku })
                })
                .then(res => {
                    if (res.ok) {
                        location.reload();
                    } else {
                        res.text().then(text => alert('เกิดข้อผิดพลาด: ' + text));
                    }
                })
                .catch(err => alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err));
            }
        });
    });

    // บันทึกการเปลี่ยนแปลง
    saveChangesBtn.addEventListener('click', async () => {
        const sku = editSkuInput.value;
        const sizeInputs = editSizeInputsContainer.querySelectorAll('select');
        
        let hasError = false;

        for (const input of sizeInputs) {
            const size = input.name;
            const qty = input.value;

            try {
                const response = await fetch('/edit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sku, size, qty })
                });

                if (!response.ok) {
                    hasError = true;
                    console.error(`เกิดข้อผิดพลาดในการอัปเดตขนาด ${size}`);
                    const errorText = await response.text();
                    // แทนที่ alert() ด้วยการแสดงข้อความบนหน้าจอ
                    const messageBox = document.createElement('div');
                    messageBox.innerText = `ไม่สามารถอัปเดต ${size}: ${errorText}`;
                    messageBox.style = "position: fixed; top: 20px; right: 20px; background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; z-index: 9999;";
                    document.body.appendChild(messageBox);
                    setTimeout(() => messageBox.remove(), 3000);
                    break; 
                }
            } catch (err) {
                hasError = true;
                console.error('Fetch error:', err);
                // แทนที่ alert() ด้วยการแสดงข้อความบนหน้าจอ
                const messageBox = document.createElement('div');
                messageBox.innerText = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
                messageBox.style = "position: fixed; top: 20px; right: 20px; background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; z-index: 9999;";
                document.body.appendChild(messageBox);
                setTimeout(() => messageBox.remove(), 3000);
                break;
            }
        }
        
        if (!hasError) {
           location.reload(); // รีโหลดหน้าเพื่อแสดงข้อมูลล่าสุด
        }
    });

    // --- การทำงานของปุ่ม Import CSV ---
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการนำเข้าข้อมูลจากไฟล์ CSV หรือไม่?')) {
                fetch('/import-csv', {
                    method: 'POST'
                })
                .then(res => {
                    if (res.ok) {
                        // แสดงข้อความว่านำเข้าสำเร็จ
                         const messageBox = document.createElement('div');
                         messageBox.innerText = 'นำเข้าข้อมูลสำเร็จ!';
                         messageBox.style = "position: fixed; top: 20px; right: 20px; background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; z-index: 9999;";
                         document.body.appendChild(messageBox);
                         setTimeout(() => {
                             messageBox.remove();
                             location.reload(); // รีโหลดหน้าเพื่อแสดงผลลัพธ์
                         }, 2000);
                    } else {
                        res.text().then(text => {
                            // แสดงข้อความว่าเกิดข้อผิดพลาด
                            const messageBox = document.createElement('div');
                            messageBox.innerText = `เกิดข้อผิดพลาดในการนำเข้า: ${text}`;
                            messageBox.style = "position: fixed; top: 20px; right: 20px; background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; z-index: 9999;";
                            document.body.appendChild(messageBox);
                            setTimeout(() => messageBox.remove(), 3000);
                        });
                    }
                })
                .catch(err => {
                     // แสดงข้อความว่าเกิดข้อผิดพลาดในการเชื่อมต่อ
                    const messageBox = document.createElement('div');
                    messageBox.innerText = `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err}`;
                    messageBox.style = "position: fixed; top: 20px; right: 20px; background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; z-index: 9999;";
                    document.body.appendChild(messageBox);
                    setTimeout(() => messageBox.remove(), 3000);
                });
            }
        });
    }

    // --- Swipe Gestures for Sidebar ---
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; // Min distance for a swipe
    const edgeThreshold = 40; // Max distance from edge to start swipe

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        // Swipe Right from Left Edge to Open
        if (deltaX > swipeThreshold && touchStartX < edgeThreshold && !sidebar.classList.contains('active')) {
            openSidebar();
        }
        // Swipe Left to Close
        if (deltaX < -swipeThreshold && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    }
    // --- ฟังก์ชัน Swipe to Dismiss สำหรับ Modal ---
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let modalTopOffset = 0;
    const dragThreshold = 50; // ระยะที่ต้องลากถึงจะถือว่าปัดทิ้ง

    modalContent.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        modalTopOffset = modalContent.offsetTop;
        modalContent.style.transition = 'none';
    });

    modalContent.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        modalContent.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });

    modalContent.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        modalContent.style.transition = 'transform 0.3s ease-in-out';

        if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
            modalContent.style.transform = `translate(${deltaX * 5}px, ${deltaY * 5}px)`;
            setTimeout(() => {
                editModal.style.display = 'none';
                modalContent.style.transform = 'translateY(0)';
            }, 300);
        } else {
            modalContent.style.transform = 'translateY(0)';
        }
    });
    
    // สำหรับมือถือ
    modalContent.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        modalTopOffset = modalContent.offsetTop;
        modalContent.style.transition = 'none';
    });

    modalContent.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        modalContent.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });

    modalContent.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        modalContent.style.transition = 'transform 0.3s ease-in-out';

        if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
            modalContent.style.transform = `translate(${deltaX * 5}px, ${deltaY * 5}px)`;
            setTimeout(() => {
                editModal.style.display = 'none';
                modalContent.style.transform = 'translateY(0)';
            }, 300);
        } else {
            modalContent.style.transform = 'translateY(0)';
        }
    });

});
