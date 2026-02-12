/* ----------------------------------------------------
   1. POPULATE BRANDS
   IDs assumed: 1=HP, 2=Dell, 3=Lenovo, 4=Epson, etc.
   ---------------------------------------------------- */
INSERT INTO [dbo].[brand] ([name]) VALUES 
('HP'), ('Dell'), ('Lenovo'), ('Epson'), ('Canon'), 
('Samsung'), ('Brother'), ('Acer'), ('Asus'), 
('Logitech'), ('Proodle'), ('D-Link');

/* ----------------------------------------------------
   2. POPULATE DEVICE TYPES
   IDs assumed: 1=Desktop, 2=Laptop, 3=Monitor, etc.
   ---------------------------------------------------- */
INSERT INTO [dbo].[device_type] ([name]) VALUES 
('Desktop Computer'), ('Laptop'), ('Monitor'), 
('Printer (Laser)'), ('Printer (Dot Matrix)'), 
('Scanner'), ('UPS'), ('Projector'), 
('Network Switch'), ('Router'), ('Fingerprint Machine');

/* ----------------------------------------------------
   3. POPULATE DEVICE MODELS
   Links Brand ID + Device Type ID
   ---------------------------------------------------- */
INSERT INTO [dbo].[device_model] ([brand_id], [device_type_id], [name]) VALUES 
-- Desktops (Brand ID, Type ID=1)
(1, 1, 'ProDesk 600 G4'),      -- HP
(1, 1, 'EliteDesk 800 G3'),    -- HP
(2, 1, 'OptiPlex 3050'),       -- Dell
(2, 1, 'OptiPlex 7070'),       -- Dell
(3, 1, 'ThinkCentre M720'),    -- Lenovo

-- Laptops (Brand ID, Type ID=2)
(1, 2, 'ProBook 450 G6'),      -- HP
(2, 2, 'Latitude 3520'),       -- Dell
(3, 2, 'ThinkPad E14'),        -- Lenovo
(8, 2, 'TravelMate P2'),       -- Acer

-- Monitors (Brand ID, Type ID=3)
(1, 3, 'P204v 20-inch'),       -- HP
(2, 3, 'E2417H 24-inch'),      -- Dell
(6, 3, 'SyncMaster S19A'),     -- Samsung
(8, 3, 'V196HQL'),             -- Acer

-- Printers (Laser) (Brand ID, Type ID=4)
(1, 4, 'LaserJet Pro M402n'),  -- HP 
(5, 4, 'imageCLASS LBP6030'),  -- Canon

-- Printers (Dot Matrix) (Brand ID, Type ID=5)
(4, 5, 'LQ-310'),              -- Epson (Standard for receipts)
(4, 5, 'LQ-2190'),             -- Epson (Wide carriage)

-- Scanners (Brand ID, Type ID=6)
(5, 6, 'LiDE 300'),            -- Canon
(1, 6, 'ScanJet Pro 2000'),    -- HP

-- UPS (Brand ID, Type ID=7)
(11, 7, 'Proodle 650VA'),      -- Proodle
(11, 7, 'Proodle 1200VA');     -- Proodle
GO