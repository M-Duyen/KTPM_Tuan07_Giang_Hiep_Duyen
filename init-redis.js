const { client, connect } = require('./shared/redisClient');

const products = [
    { id: '1', name: 'iPhone 15 Pro', price: 999, description: 'Latest Apple smartphone with Titanium design', image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_2__5_2_1_1.jpg' },
    { id: '2', name: 'MacBook Air M2', price: 1199, description: 'Thin and light laptop with M2 chip', image: 'https://cdn2.fptshop.com.vn/unsafe/828x0/filters:format(webp):quality(75)/2022_7_21_637939929611057893_Macbook%20Air%20M2%20(8).jpg' },
    { id: '3', name: 'AirPods Pro 2', price: 249, description: 'Noise cancelling earbuds with MagSafe', image: 'https://cdn.tgdd.vn/Products/Images/54/315014/tai-nghe-bluetooth-airpods-pro-2nd-gen-usb-c-charge-apple-1-750x500.jpg' },
    { id: '4', name: 'iPad Pro', price: 799, description: 'Powerful tablet for pros with Liquid Retina XDR', image: 'https://cdn2.cellphones.com.vn/x/media/catalog/product/i/p/ipad-pro-11-2021-1_13.jpg' },
    { id: '5', name: 'Apple Watch Ultra', price: 799, description: 'Rugged outdoor watch with extreme durability', image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_604_5.png' },
    { id: '6', name: 'Apple Magic Mouse 2', price: 799, description: 'Magic Mouse 2 with a built-in rechargeable battery and a thinner, lighter design', image: 'https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/11/magic-mouse-2.jpg' }
];

const stockLevels = {
    '1': 10,
    '2': 5,
    '3': 20,
    '4': 8,
    '5': 3,
    '6': 6
};

async function init() {
    await connect();
    
    console.log('Cleaning existing data...');
    const keys = await client.keys('*');
    if (keys.length > 0) {
        await client.del(keys);
    }

    console.log('Seeding products...');
    for (const product of products) {
        await client.hSet(`product:${product.id}`, {
            name: product.name,
            price: product.price.toString(),
            description: product.description,
            image: product.image
        });
        console.log(`- Product ${product.name} seeded`);
    }

    console.log('Seeding stock...');
    for (const [id, stock] of Object.entries(stockLevels)) {
        await client.set(`stock:${id}`, stock.toString());
        console.log(`- Stock for product ${id}: ${stock}`);
    }

    console.log('Initialization complete!');
    process.exit(0);
}

init().catch(err => {
    console.error(err);
    process.exit(1);
});
