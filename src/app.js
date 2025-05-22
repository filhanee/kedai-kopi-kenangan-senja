document.addEventListener('alpine:init', () => {
  Alpine.data('products', () => ({
    items: [
      { id: 1, name: 'Robusta Brazil', img: '1.jpg', price: 20000 },
      { id: 2, name: 'Arabica Blend', img: '2.jpg', price: 25000 },
      { id: 3, name: 'Primo Passo', img: '3.jpg', price: 30000 },
      { id: 4, name: 'Aceh Gayo', img: '4.jpg', price: 35000 },
      { id: 5, name: 'Sumatra Mandheling', img: '5.jpg', price: 40000 },
    ],
  }));

  Alpine.store('cart', {
    items: [],
    total: 0,
    quantity: 0,
    add(newItem) {
      // cek apakah ada barang yang sama
      const cartItem = this.items.find((item) => item.id === newItem.id);

      // Jika belum ada/cart masih kosong
      if (!cartItem) {
        this.items.push({...newItem, quantity: 1, total: newItem.price });
        this.quantity++;
        this.total += newItem.price;
      } else {
        // Jika barang sudah ada , cek apakah barang beda atau sama dengan yang ada di cart
        this.items = this.items.map((item) => {
          // Jika barang berbeda
          if (item.id !== newItem.id) {
            return item;
          } else {
            // Jika barang sudah ada, tambah quantity dan totalnya
            item.quantity++;
            item.total = item.price *  item.quantity;
            this.quantity++;
            this.total += item.price;
            return item;
          }
        });
      }
    },

    remove(id) { 
      const cartItem = this.items.find((item) => item.id === id);

      if (cartItem) {
        if (cartItem.quantity > 1) {
          // Kurangi quantity jika lebih dari 1
          this.items = this.items.map((item) => {
            if (item.id !== id) {
              return item;
            } else {
              item.quantity--;
              item.total = item.price * item.quantity;
              this.quantity--;
              this.total -= item.price;
              return item;
            }
          });
        } else {
          // Hapus item jika quantity-nya 1
          this.items = this.items.filter((item) => item.id !== id);
          this.quantity--;
          this.total -= cartItem.price;
        }
      }
    },
  });
});

//  Form Validation
const checkoutButton = document.querySelector('.checkout-button');
checkoutButton.disabled = true;

const form = document.querySelector('#checkoutForm');

form.addEventListener('keyup', function() {
  for(let i = 0; i < form.elements.length; i++) {
    if(form.elements[i].value.length !== 0) {
      checkoutButton.classList.remove('disabled');
      checkoutButton.classList.add('disabled');
    } else {
      return false;
    }
  }
  checkoutButton.disabled = false;
  checkoutButton.classList.remove('disabled');
});

// Kirim data ketika tombol checkout diklik
checkoutButton.addEventListener('click', async function(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const data = new URLSearchParams(formData);
  const objData = Object.fromEntries(data);
  const message = formatMessage(objData);
  console.log(objData);
  // console.log("Pesan Mentah:", message);
  // console.log("Pesan yang di-encode:", encodeURIComponent(message));
  // window.open('http://wa.me/628988422345?text=' + encodeURIComponent(message));

  // Minta token transaksi menggunakan ajax / fetch
  try {
    const response = await fetch('php/placeOrder.php', {
      method: 'POST',
      body: data,
    });
    const token = await response.text();
    // console.log(token); 
    window.snap.pay(token);
  } catch (err) {
    console.log(err.message);
  }

});

// Format pesan Whatsapp
const formatMessage = (obj) => {
    const namaCustomer = obj.name || 'Tidak Ada Nama';
    const emailCustomer = obj.email || 'Tidak Ada Email';
    const phoneCustomer = obj.phone || 'Tidak Ada No. HP';

    let messageContent = `Data Customer:\n`;
    messageContent += `Nama: ${namaCustomer}\n`;
    messageContent += `Email: ${emailCustomer}\n`;
    messageContent += `NO HP: ${phoneCustomer}\n\n`; 

    messageContent += `Data Pesanan:\n`;

    try {
        const items = JSON.parse(obj.items);

        if (Array.isArray(items)) {
            messageContent += items.map((item) => {
                const itemName = item.name || 'Produk Tidak Dikenal';
                const itemQuantity = item.quantity || 0;
                const itemTotal = item.total || 0; 
                return `${itemName} (${item.quantity} x ${rupiah(item.total)})`;
            }).join('\n'); 
            messageContent += '\n';
        } else {
            messageContent += "Data pesanan tidak valid atau kosong.\n";
        }

        const totalAmount = obj.total || 0; 

        messageContent += `TOTAL: ${rupiah(totalAmount)}\n\n`;

    } catch (error) {
        console.error("Error memproses data pesanan:", error);
        messageContent += "Gagal memproses detail pesanan.\n\n";
    }

    messageContent += `Terima kasih.`;

    return messageContent;
};


// konversi ke Rupiah
function rupiah(number) {
    if (typeof number === 'string') {
        number = parseFloat(number);
    }
    if (isNaN(number)) {
        return 'Rp 0'; // Atau pesan error lain
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}