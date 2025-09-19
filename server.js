import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import mongoose from 'mongoose';
import dotenv from "dotenv";
import csv from 'csv-parser';

// โหลดค่าจากไฟล์ .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const root = process.cwd();

// --- การตั้งค่า Path ---
const uploadsDir = path.join(root, "uploads");
const publicDir = path.join(root, "public");
const viewsDir = path.join(root, "views");

// สร้าง Directory หากยังไม่มี
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(viewsDir, { recursive: true });

// --- ตั้งค่า Multer สำหรับการอัปโหลดไฟล์ ---
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// [ปรับปรุง] Serve icons และ manifest พร้อม Cache-Control Headers เพื่อแก้ปัญหา Cache
// การตั้งค่านี้จะบอกเบราว์เซอร์ให้ตรวจสอบไฟล์ใหม่ทุกครั้ง
const staticIconOptions = {
    setHeaders: (res, path, stat) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
};
app.use(express.static(path.join(publicDir, "icon"), staticIconOptions));

app.get('/manifest.json', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(viewsDir, 'manifest.json'));
});

app.use("/uploads", express.static(uploadsDir));
app.use("/public", express.static(publicDir));
app.set("view engine", "ejs");
app.set("views", viewsDir);

// --- Mongoose Schema & Model ---
const itemSchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true },
    imagepath: String,
    imagepath_b: String,
    sizes: {
        xs: { type: Number, default: 0 },
        s: { type: Number, default: 0 },
        m: { type: Number, default: 0 },
        l: { type: Number, default: 0 },
        xl: { type: Number, default: 0 },
        xxl: { type: Number, default: 0 }
    }
});
const Item = mongoose.model('Item', itemSchema);

// --- การเชื่อมต่อ MongoDB ด้วย Mongoose ---
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Online!");
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ MongoDB:", err);
    process.exit(1); // ออกจากโปรแกรมหากเชื่อมต่อไม่ได้
  }
}

// --- Helper Function ---
async function getNextSku() {
    const lastItem = await Item.findOne().sort({ sku: -1 }).lean();
    if (lastItem && !isNaN(parseInt(lastItem.sku, 10))) {
        const lastSkuNum = parseInt(lastItem.sku, 10);
        return String(lastSkuNum + 1).padStart(2, '0');
    }
    return '00'; // ถ้ายังไม่มีสินค้าในระบบเลย
}

// --- Routes ---
// หน้าหลัก: แสดงข้อมูลสินค้าทั้งหมด
app.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ sku: 1 }).lean();
    const nextSku = await getNextSku();

    res.render("index", { items, nextSku });
  } catch (err) {
    res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
});

// เพิ่ม/อัปเดตสินค้า
app.post("/submit", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image_b', maxCount: 1 }]), async (req, res) => {
    const { sku: skuTrim, size, qty } = req.body;
    const quantity = parseInt(qty, 10) || 1;
    
    try {
        let existingItem = await Item.findOne({ sku: skuTrim });

        let sku = skuTrim;
        if (!existingItem && !skuTrim) {
            sku = await getNextSku();
        }

        let imagepath = existingItem ? existingItem.imagepath : "";
        let imagepath_b = existingItem ? existingItem.imagepath_b : "";

        // จัดการไฟล์รูปภาพหลัก
        if (req.files['image']) {
            const ext = path.extname(req.files['image'][0].originalname);
            imagepath = sku + ext;
            fs.renameSync(req.files['image'][0].path, path.join(uploadsDir, imagepath));
        } else if (!existingItem) {
            return res.status(400).send("ต้องอัปโหลดรูปภาพหน้าสำหรับสินค้าใหม่");
        }

        // จัดการไฟล์รูปภาพรอง
        if (req.files['image_b']) {
            const ext = path.extname(req.files['image_b'][0].originalname);
            imagepath_b = sku + "-b" + ext;
            fs.renameSync(req.files['image_b'][0].path, path.join(uploadsDir, imagepath_b));
        }
        
        const sizeKey = size.toLowerCase();
        
        if (existingItem) {
            // อัปเดตสินค้าที่มีอยู่แล้ว
            const updateField = `sizes.${sizeKey}`;
            await Item.updateOne(
                { _id: existingItem._id },
                { 
                    $inc: { [updateField]: quantity },
                    $set: { imagepath, imagepath_b }
                }
            );
        } else {
            // เพิ่มสินค้าใหม่
            const newItem = new Item({
                sku,
                imagepath,
                imagepath_b,
                sizes: {
                    [sizeKey]: quantity
                }
            });
            await newItem.save();
        }

        res.redirect("/");

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
});

// แก้ไขจำนวนสินค้า
app.post("/edit", async (req, res) => {
    const { sku, size, qty } = req.body;
    const quantity = parseInt(qty, 10);

    if (!sku || !size || quantity === undefined || quantity < 0) {
        return res.status(400).send("ข้อมูลไม่ถูกต้อง");
    }

    try {
        const sizeKey = `sizes.${size.toLowerCase()}`;
        const updatedItem = await Item.findOneAndUpdate(
            { sku: sku },
            { $set: { [sizeKey]: quantity } },
            { new: true } // {new: true} เพื่อให้ return document ที่อัปเดตแล้ว
        );

        if (updatedItem) {
            res.json(updatedItem);
        } else {
            res.status(404).send("ไม่พบสินค้า");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการอัปเดต");
    }
});

// ลบสินค้า
app.post('/delete', async (req, res) => {
    const { sku } = req.body;
    if (!sku) return res.status(400).send('ไม่พบ SKU');
    
    try {
        const itemToDelete = await Item.findOne({ sku });
        if (!itemToDelete) return res.status(404).send('ไม่พบสินค้า');

        // ลบไฟล์รูปภาพ
        if (itemToDelete.imagepath) {
            const imageFile = path.join(uploadsDir, itemToDelete.imagepath);
            if (fs.existsSync(imageFile)) fs.unlinkSync(imageFile);
        }
        if (itemToDelete.imagepath_b) {
            const imageFileB = path.join(uploadsDir, itemToDelete.imagepath_b);
            if (fs.existsSync(imageFileB)) fs.unlinkSync(imageFileB);
        }

        await Item.deleteOne({ sku });
        res.status(200).send('ลบสินค้าเรียบร้อย');
    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการลบ");
    }
});

// Endpoint ใหม่สำหรับ Import CSV
app.post('/import-csv', async (req, res) => {
    try {
        const csvFilePath = path.join(process.cwd(), 'data.csv'); // แก้ path ให้ถูกต้อง
        const results = [];
        
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => {
                const sizes = {
                    xs: parseInt(data.xs) || 0,
                    s: parseInt(data.s) || 0,
                    m: parseInt(data.m) || 0,
                    l: parseInt(data.l) || 0,
                    xl: parseInt(data.xl) || 0,
                    xxl: parseInt(data.xxl) || 0
                };
                
                const item = {
                    sku: data.sku,
                    imagepath: data.imagepath,
                    imagepath_b: data.imagepath_b,
                    sizes: sizes
                };
                results.push(item);
            })
            .on('end', async () => {
                try {
                    await Item.insertMany(results, { ordered: false });
                    res.status(200).send("นำเข้าข้อมูลเรียบร้อย");
                } catch (err) {
                    if (err.code === 11000) {
                        res.status(409).send("มีข้อมูล SKU ซ้ำ");
                    } else {
                        console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", err);
                        res.status(500).send("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
                    }
                }
            });
    } catch (err) {
        console.error(err);
        res.status(500).send("ไม่พบไฟล์ CSV หรือเกิดข้อผิดพลาดในการประมวลผล");
    }
});


// เริ่มต้น Server
app.listen(port, () => {
  console.log(`Server Online http://localhost:${port}`);
  connectDB();
});
