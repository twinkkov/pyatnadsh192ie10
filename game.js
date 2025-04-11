// Инициализация Telegram WebApp
window.Telegram.WebApp.expand();

const secretNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

document.getElementById('guessButton').addEventListener('click', () => {
    const guess = parseInt(document.getElementById('guessInput').value);
    attempts++;
    
    if (guess === secretNumber) {
        document.getElementById('message').textContent = 
            `Поздравляю! Ты угадал число за ${attempts} попыток!`;
        window.Telegram.WebApp.sendData(`Угадал за ${attempts} попыток`);
    } else if (guess < secretNumber) {
        document.getElementById('message').textContent = 'Слишком мало!';
    } else {
        document.getElementById('message').textContent = 'Слишком много!';
    }
});