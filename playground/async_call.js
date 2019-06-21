async function first() {
    console.log('First');

    return 1;
}

async function second() {
    console.log('Second/1');
    const result1 = await first();
    console.log('Second/2');

    return result1 + 1;
}

async function third() {
    console.log('Third/1');
    const result2 = await second();
    console.log('Third/2');

    return result2 + 1;
}

(async () => {
    console.log('Top/1');
    const result3 = await third();
    console.log('Result is ' + result3);
   console.log('Top/2');
})().then(() =>
{
    console.log('Top/3');
});

