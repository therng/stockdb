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

    // --- Swipe Gestures & Responsive Sidebar ---
    // Sidebar swipe open/close with smooth follow and scroll lock
    let sidebarTouching = false;
    let sidebarStartX = 0;
    let sidebarCurrentX = 0;
    let sidebarDragging = false;
    const sidebarSwipeThreshold = 50;
    const sidebarEdgeThreshold = 40;
    let sidebarWasOpen = false;

    // Touch start: detect from edge to open, or on sidebar to close
    document.addEventListener('touchstart', e => {
        if (!sidebar) return;
        const x = e.touches[0].clientX;
        sidebarWasOpen = sidebar.classList.contains('active');
        // Open gesture (from edge)
        if (!sidebarWasOpen && x < sidebarEdgeThreshold) {
            sidebarTouching = true;
            sidebarStartX = x;
            sidebarCurrentX = x;
            sidebar.style.transition = 'none';
            sidebar.classList.add('dragging');
        }
        // Close gesture (from sidebar area)
        if (sidebarWasOpen && x < sidebar.offsetWidth + 20) {
            sidebarTouching = true;
            sidebarStartX = x;
            sidebarCurrentX = x;
            sidebar.style.transition = 'none';
            sidebar.classList.add('dragging');
        }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (!sidebarTouching) return;
        const x = e.touches[0].clientX;
        sidebarCurrentX = x;
        let delta = x - sidebarStartX;
        if (!sidebarWasOpen) { // Opening
            if (delta > 0 && delta < sidebar.offsetWidth) {
                sidebar.style.transform = `translateX(${delta - sidebar.offsetWidth}px)`;
            }
        } else { // Closing
            if (delta < 0 && Math.abs(delta) < sidebar.offsetWidth) {
                sidebar.style.transform = `translateX(${delta}px)`;
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', e => {
        if (!sidebarTouching) return;
        sidebarTouching = false;
        sidebar.style.transition = 'transform 0.25s cubic-bezier(.4,0,.2,1)';
        sidebar.classList.remove('dragging');
        let delta = sidebarCurrentX - sidebarStartX;
        if (!sidebarWasOpen) { // Opening
            if (delta > sidebarSwipeThreshold) {
                sidebar.style.transform = '';
                openSidebar();
            } else {
                sidebar.style.transform = '';
                closeSidebar();
            }
        } else { // Closing
            if (delta < -sidebarSwipeThreshold) {
                sidebar.style.transform = '';
                closeSidebar();
            } else {
                sidebar.style.transform = '';
                openSidebar();
            }
        }
        setTimeout(() => {
            if (sidebar) sidebar.style.transition = '';
            if (sidebar) sidebar.style.transform = '';
        }, 300);
    });

    // Prevent sidebar scroll from scrolling body (lock scroll)
    if (sidebar) {
        sidebar.addEventListener('touchmove', function(e) {
            const atTop = sidebar.scrollTop === 0;
            const atBottom = sidebar.scrollHeight - sidebar.scrollTop === sidebar.clientHeight;
            const touch = e.touches[0];
            let lastY = sidebar._lastTouchY || touch.clientY;
            let newY = touch.clientY;
            let deltaY = newY - lastY;
            sidebar._lastTouchY = newY;
            if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
                e.preventDefault();
            }
        }, { passive: false });
        sidebar.addEventListener('touchend', function() {
            sidebar._lastTouchY = undefined;
        });
    }

    // --- Modal Drag (Smooth/Responsive) ---
    let modalDragStartY = 0;
    let modalDragCurrentY = 0;
    let modalDragging = false;
    let modalStartTransform = 0;
    const modalDragThreshold = 80;

    // Mouse events
    modalContent.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        modalDragging = true;
        modalDragStartY = e.clientY;
        modalDragCurrentY = e.clientY;
        modalContent.style.transition = 'none';
        modalStartTransform = 0;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!modalDragging) return;
        modalDragCurrentY = e.clientY;
        let deltaY = modalDragCurrentY - modalDragStartY;
        if (deltaY > 0) {
            modalContent.style.transform = `translateY(${deltaY}px)`;
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (!modalDragging) return;
        modalDragging = false;
        document.body.style.userSelect = '';
        let deltaY = modalDragCurrentY - modalDragStartY;
        modalContent.style.transition = 'transform 0.25s cubic-bezier(.4,0,.2,1)';
        if (deltaY > modalDragThreshold) {
            modalContent.style.transform = `translateY(100vh)`;
            setTimeout(() => {
                editModal.style.display = 'none';
                modalContent.style.transform = 'translateY(0)';
                modalContent.style.transition = '';
            }, 250);
        } else {
            modalContent.style.transform = 'translateY(0)';
            setTimeout(() => {
                modalContent.style.transition = '';
            }, 250);
        }
    });

    // Touch events
    modalContent.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return;
        modalDragging = true;
        modalDragStartY = e.touches[0].clientY;
        modalDragCurrentY = e.touches[0].clientY;
        modalContent.style.transition = 'none';
        modalStartTransform = 0;
    }, { passive: true });
    modalContent.addEventListener('touchmove', (e) => {
        if (!modalDragging) return;
        if (e.touches.length > 1) return;
        modalDragCurrentY = e.touches[0].clientY;
        let deltaY = modalDragCurrentY - modalDragStartY;
        if (deltaY > 0) {
            modalContent.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });
    modalContent.addEventListener('touchend', (e) => {
        if (!modalDragging) return;
        modalDragging = false;
        let deltaY = modalDragCurrentY - modalDragStartY;
        modalContent.style.transition = 'transform 0.25s cubic-bezier(.4,0,.2,1)';
        if (deltaY > modalDragThreshold) {
            modalContent.style.transform = `translateY(100vh)`;
            setTimeout(() => {
                editModal.style.display = 'none';
                modalContent.style.transform = 'translateY(0)';
                modalContent.style.transition = '';
            }, 250);
        } else {
            modalContent.style.transform = 'translateY(0)';
            setTimeout(() => {
                modalContent.style.transition = '';
            }, 250);
        }
    }, { passive: true });

    // Prevent modal drag from scrolling body
    if (modalContent) {
        modalContent.addEventListener('touchmove', function(e) {
            if (modalDragging) e.preventDefault();
        }, { passive: false });
    }

    // Make sidebar scrollable, not overflow viewport
    if (sidebar) {
        sidebar.style.maxHeight = '100vh';
        sidebar.style.overflowY = 'auto';
    }
});
