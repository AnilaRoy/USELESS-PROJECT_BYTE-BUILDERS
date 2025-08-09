const wordBank = [
  "apple", "banana", "grape", "kiwi", "mango", "orange", "peach", "pear", "plum", "berry",
  "dog", "cat", "horse", "lion", "tiger", "zebra", "bear", "wolf", "fox", "eagle",
  "car", "bike", "train", "plane", "ship", "truck", "bus", "van", "scooter", "submarine",
  "happy", "sad", "angry", "excited", "tired", "sleepy", "hungry", "bored", "confused", "surprised"
];

// Generate initial random words
function generateRandomWords(count) {
    let words = [];
    for (let i = 0; i < count; i++) {
        words.push(wordBank[Math.floor(Math.random() * wordBank.length)]);
    }
    return words;
}

let words = generateRandomWords(50);
document.getElementById("displayText").innerText = words.join(" ");

const trollWords = ["banana", "flamingo", "toaster", "unicorn", "broccoli", "penguin", "waffle", "llama"];
let lastSabotagedIndex = -1;

function updateDisplay() {
  document.getElementById("displayText").innerText = words.join(" ");
}

let timeLeft = 60; // seconds
let timerInterval = setInterval(() => {
  timeLeft--;
  document.getElementById("timer").innerText = `Time: ${timeLeft}s`;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    document.getElementById("inputBox").disabled = true;
    document.getElementById("submitBtn").disabled = true;

    const funnyEndings = [
        "⏳ Too slow, grandpa!",
        "🐢 Did you stop for a nap?",
        "💀 My grandma types faster.",
        "🛑 Keyboard broken or just your skills?",
        "🐌 Wow… speed limit was 80 wpm, you hit 2.",
        "🍌 Slipped on a typing banana?",
        "🔥 Keyboard melted from the lack of action?",
        "🤡 Typing school dropout detected."
    ];

    // Pick a random roast
    const randomMessage = funnyEndings[Math.floor(Math.random() * funnyEndings.length)];

    const msg = document.createElement("div");
    msg.innerText = randomMessage;
    msg.style.position = "fixed";
    msg.style.top = "50%";
    msg.style.left = "50%";
    msg.style.transform = "translate(-50%, -50%)";
    msg.style.fontSize = "2rem";
    msg.style.fontWeight = "bold";
    msg.style.color = "red";
    msg.style.background = "rgba(0,0,0,0.7)";
    msg.style.padding = "20px 40px";
    msg.style.borderRadius = "10px";
    document.body.appendChild(msg);
  }
}, 1000);

document.getElementById("inputBox").addEventListener("input", () => {
  let typed = document.getElementById("inputBox").value.trim().split(" ");
  let currentWordIndex = typed.length - 1;

  // Sabotage typed word
  if (currentWordIndex >= 0 && 
      currentWordIndex < words.length && 
      lastSabotagedIndex !== currentWordIndex &&
      typed[currentWordIndex].length >= 2) {
        
    if (Math.random() < 0.01) { // 1% chance
      words[currentWordIndex] = trollWords[Math.floor(Math.random() * trollWords.length)];
      lastSabotagedIndex = currentWordIndex;
      updateDisplay();
    }
  }

  // Randomly erase a previous word
  if (typed.length > 1 && Math.random() < 0.05) { // 5% chance
    let randomPrevIndex = Math.floor(Math.random() * currentWordIndex); 
    words[randomPrevIndex] = "";
    updateDisplay();
  }

  // Random emoji blocking
  if (Math.random() < 0.2) { // 20% chance
    spawnBlockingEmoji();
  }

  updateRage(e);
});

function spawnBlockingEmoji() {
    const emojis = ["😂", "🔥", "😎", "💀", "🥶", "🤡", "🎯", "🍌", "💥", "🐸"];
    let randomIndex = Math.floor(Math.random() * words.length);
    let originalWord = words[randomIndex];

    // Replace with emoji
    words[randomIndex] = emojis[Math.floor(Math.random() * emojis.length)];
    updateDisplay();

    // Restore after 3 seconds
    setTimeout(() => {
        words[randomIndex] = originalWord;
        updateDisplay();
    }, 3000);
}

// Rage Meter Logic
let rageLevel = 0;
let lastKeyTime = Date.now();

function updateRageBar() {
  if (rageLevel < 0) rageLevel = 0;
  if (rageLevel > 100) rageLevel = 100;

  const rageBar = document.getElementById("rageBar");
  rageBar.style.height = rageLevel + "%";

  if (rageLevel < 30) {
    rageBar.style.background = "linear-gradient(180deg, limegreen, yellowgreen)";
    rageBar.style.boxShadow = "0 0 10px limegreen, 0 0 20px yellowgreen";
  } else if (rageLevel < 70) {
    rageBar.style.background = "linear-gradient(180deg, orange, gold)";
    rageBar.style.boxShadow = "0 0 15px orange, 0 0 30px gold";
  } else {
    rageBar.style.background = "linear-gradient(180deg, red, orange)";
    rageBar.style.boxShadow = "0 0 20px red, 0 0 40px orange";
  }

  document.getElementById("rageText").innerText = `Rage: ${Math.round(rageLevel)}%`;
}

function updateRage(e) {
  let now = Date.now();
  let speed = now - lastKeyTime;
  lastKeyTime = now;

  if (speed < 150) rageLevel += 2;
  if (e.key === "Backspace") rageLevel += 5;
  rageLevel -= 0.5;

  updateRageBar();
}

document.addEventListener("keydown", updateRage);

let correctWordCount = 0;

// Check correct words as the user types
document.getElementById("inputBox").addEventListener("input", () => {
    let typedWords = document.getElementById("inputBox").value.trim().split(" ");
    correctWordCount = 0;
    for (let i = 0; i < typedWords.length; i++) {
        if (typedWords[i] === words[i]) {
            correctWordCount++;
        }
    }
    msg.innerHTML = `
        <div>${message}</div>
        <div>✅ Words Correct: ${correctWordCount} / ${words.length}</div>
        <div>🔥 Final Rage: ${Math.min(rage, 100)}%</div>
    `;

    document.body.appendChild(msg);
});
