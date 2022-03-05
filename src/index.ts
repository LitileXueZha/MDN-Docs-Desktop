import light from '@primer/primitives/dist/js/colors/light';
import dark from '@primer/primitives/dist/js/colors/dark';

const word: string = 'Hello world';

document.addEventListener('DOMContentLoaded', async () => {
    console.log(word, { light, dark });
});
