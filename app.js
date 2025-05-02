const express = require("express");
const bodyParser = require("body-parser");
const koneksi = require("./config/database");
const app = express();
const PORT = process.env.PORT || 8000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/shipment", (req, res) => {
  const data = { ...req.body };
  const querySql = "INSERT INTO dat_orders SET ?";

  // jalankan query
  koneksi.query(querySql, data, (err, rows, field) => {
    // error handling
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to create shipment", error: err });
    }

    // jika request berhasil
    res
      .status(200)
      .json({ success: true, message: "Shipment created successfully" });
  });
});

// read data
app.get("/shipment/list", (req, res) => {
  // buat query sql
  const querySql = "SELECT * FROM dat_orders";

  // jalankan query
  koneksi.query(querySql, (err, rows, field) => {
    // error handling
    if (err) {
      return res.status(500).json({ message: "Item not found", error: err });
    }

    // jika request berhasil
    res.status(200).json({ success: true, data: rows });
  });
});

// update data
app.put("/shipment/:id", (req, res) => {
  // buat variabel penampung data dan query sql
  const data = { ...req.body };
  const querySearch = "SELECT * FROM dat_orders WHERE id = ?";
  const queryUpdate = "UPDATE dat_orders SET ? WHERE id = ?";

  // jalankan query untuk melakukan pencarian data
  koneksi.query(querySearch, req.params.id, (err, rows, field) => {
    // error handling
    if (err) {
      return res
        .status(500)
        .json({ message: "Error failed to fetch", error: err });
    }

    // jika id yang dimasukkan sesuai dengan data yang ada di db
    if (rows.length) {
      // jalankan query update
      koneksi.query(queryUpdate, [data, req.params.id], (err, rows, field) => {
        // error handling
        if (err) {
          return res
            .status(500)
            .json({ message: "Error failed to fetch", error: err });
        }

        // jika update berhasil
        res
          .status(200)
          .json({ success: true, message: "Shipment updated successfully" });
      });
    } else {
      return res
        .status(404)
        .json({ message: "Item not found", success: false });
    }
  });
});

// delete data
app.delete("/shipment/:id", (req, res) => {
  // buat query sql untuk mencari data dan hapus
  const querySearch = "SELECT * FROM dat_orders WHERE id = ?";
  const queryDelete = "DELETE FROM dat_orders WHERE id = ?";

  // jalankan query untuk melakukan pencarian data
  koneksi.query(querySearch, req.params.id, (err, rows, field) => {
    // error handling
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to fetch data", error: err });
    }

    // jika id yang dimasukkan sesuai dengan data yang ada di db
    if (rows.length) {
      // jalankan query delete
      koneksi.query(queryDelete, req.params.id, (err, rows, field) => {
        // error handling
        if (err) {
          return res
            .status(500)
            .json({ message: "Failed to fetch data", error: err });
        }

        // jika delete berhasil
        res
          .status(200)
          .json({ success: true, message: "Shipment deleted successfully" });
      });
    } else {
      return res
        .status(404)
        .json({ message: "Item not found", success: false });
    }
  });
});

app.post("/shipment/:id/history", (req, res) => {
  const orderId = req.params.id;
  const { description, time, image } = req.body;

  // Validasi dasar
  if (!description || !time) {
    return res
      .status(400)
      .json({ message: "description and time are required" });
  }

  const data = {
    order_id: orderId,
    description,
    time: new Date(time), // pastikan time bisa dikonversi ke objek Date
    image: image || null,
  };

  const querySql = "INSERT INTO dat_order_logs SET ?";

  koneksi.query(querySql, data, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to create shipment history",
        error: err,
      });
    }

    res.status(200).json({
      success: true,
      message: "Shipment history created successfully",
      inserted_id: result.insertId,
    });
  });
});

app.get("/shipment/:id", (req, res) => {
  const orderId = req.params.id;

  const orderQuery = "SELECT * FROM dat_orders WHERE id = ?";

  koneksi.query(orderQuery, [orderId], (orderErr, orderResult) => {
    if (orderErr) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch order",
        error: orderErr,
      });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    const order = orderResult[0];

    const historyQuery = `
      SELECT description, time, image 
      FROM dat_order_logs 
      WHERE order_id = ? 
      ORDER BY time ASC
    `;

    koneksi.query(historyQuery, [orderId], (historyErr, historyResult) => {
      if (historyErr) {
        return res.status(500).json({
          status: false,
          message: "Failed to fetch history",
          error: historyErr,
        });
      }

      const responseData = {
        id: order.id,
        status: order.status,
        item: order.item,
        expedition: order.expedition,
        history: historyResult.map((entry) => ({
          description: entry.description,
          time: entry.time,
          ...(entry.image ? { image: entry.image } : {}),
        })),
      };

      res.status(200).json({
        status: true,
        data: responseData,
      });
    });
  });
});

app.listen(PORT, () => console.log(`Server running at port: ${PORT}`));
