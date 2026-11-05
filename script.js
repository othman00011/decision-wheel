// 1. Variables
// Keep the app's options, results, and spin state in one place.
const templates = [
  { name: "Dinner", options: ["Pizza", "Burger", "Pasta", "Sushi", "Salad"] },
  { name: "Weekend plans", options: ["Movie", "Walk", "Gaming", "Visit family", "Sleep"] },
  { name: "Study", options: ["Math", "Science", "Languages", "Break"] },
  { name: "Yes / No", options: ["Yes", "No"] }
];
const draftStorageKey = "decisionWheelDraft";
const historyStorageKey = "decisionWheelHistory";
const soundStorageKey = "decisionWheelSound";
const optionForm = document.getElementById("optionForm");
const decisionNameInput = document.getElementById("decisionNameInput");
const optionInput = document.getElementById("optionInput");
const setupMessage = document.getElementById("setupMessage");
const draftMessage = document.getElementById("draftMessage");
const optionsListElement = document.getElementById("optionsList");
const optionCount = document.getElementById("optionCount");
const startButton = document.getElementById("startButton");
const shuffleButton = document.getElementById("shuffleButton");
const templateButtons = document.getElementById("templateButtons");
const modeInputs = document.querySelectorAll('input[name="mode"]');
const setupScreen = document.getElementById("setupScreen");
const wheelScreen = document.getElementById("wheelScreen");
const wheelCanvas = document.getElementById("wheelCanvas");
const wheelDecisionName = document.getElementById("wheelDecisionName");
const wheelTitle = document.getElementById("wheelTitle");
const wheelHint = document.getElementById("wheelHint");
const wheelNote = document.getElementById("wheelNote");
const spinButton = document.getElementById("spinButton");
const nextRankButton = document.getElementById("nextRankButton");
const soundButton = document.getElementById("soundButton");
const resultsListElement = document.getElementById("resultsList");
const resultsCount = document.getElementById("resultsCount");
const rankingSection = document.getElementById("rankingSection");
const quickWinnerPanel = document.getElementById("quickWinnerPanel");
const quickWinnerName = document.getElementById("quickWinnerName");
const quickAgainButton = document.getElementById("quickAgainButton");
const copyButton = document.getElementById("copyButton");
const copyMessage = document.getElementById("copyMessage");
const finishedPanel = document.getElementById("finishedPanel");
const finishedTitle = document.getElementById("finishedTitle");
const restartButton = document.getElementById("restartButton");
const editButton = document.getElementById("editButton");
const historyListElement = document.getElementById("historyList");
const historyMessage = document.getElementById("historyMessage");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const clearHistoryConfirmation = document.getElementById("clearHistoryConfirmation");
const confirmClearHistoryButton = document.getElementById("confirmClearHistoryButton");
const cancelClearHistoryButton = document.getElementById("cancelClearHistoryButton");
const historyViewer = document.getElementById("historyViewer");
const historyViewerTitle = document.getElementById("historyViewerTitle");
const historyViewerDate = document.getElementById("historyViewerDate");
const historyViewerList = document.getElementById("historyViewerList");
const closeHistoryViewerButton = document.getElementById("closeHistoryViewerButton");
const wheelContext = wheelCanvas.getContext("2d");
const wheelColors = [
  "#f47768", "#f7b84b", "#80b879", "#49b8aa", "#55a8d7",
  "#777be8", "#aa78cf", "#e875a2", "#db985f", "#68b8a0",
  "#5996c5", "#d56f76", "#9d9b4e", "#6f83c9", "#c37757",
  "#55aaa9", "#bf79b0", "#7d9d69", "#d68d4e", "#7772bd"
];
let options = [];
let originalOptions = [];
let rankedOptions = [];
let historyEntries = [];
let decisionName = "";
let decisionMode = "full";
let soundEnabled = true;
let historySaved = false;
let decisionId = "";
let audioContext = null;
let rotationAngle = 0;
let isSpinning = false;
let animationFrameId = null;

// 2. Setup screen
// Add, remove, and validate the user's options.
optionForm.addEventListener("submit", addOption);
startButton.addEventListener("click", startRanking);
optionsListElement.addEventListener("click", removeOption);
decisionNameInput.addEventListener("input", saveDraft);
shuffleButton.addEventListener("click", shuffleOptions);
templateButtons.addEventListener("click", useTemplate);
modeInputs.forEach(function (modeInput) {
  modeInput.addEventListener("change", changeMode);
});

// Add one valid option to the list.
function addOption(event) {
  event.preventDefault();
  const newOption = optionInput.value.trim();

  if (newOption.length === 0) {
    showSetupMessage("Please type an option before adding it.");
    optionInput.focus();
    return;
  }

  let alreadyAdded = false;
  for (let index = 0; index < options.length; index += 1) {
    if (options[index].toLocaleLowerCase() === newOption.toLocaleLowerCase()) {
      alreadyAdded = true;
      break;
    }
  }

  if (alreadyAdded) {
    showSetupMessage("That option is already on your list.");
    optionInput.focus();
    return;
  }

  options.push(newOption);
  optionInput.value = "";
  showSetupMessage(options.length < 2 ? "Add at least 2 options to get started." : "");
  renderOptions();
  saveDraft();
  optionInput.focus();
}

// Remove the option named by the clicked remove button.
function removeOption(event) {
  const removeButton = event.target.closest("[data-option-index]");
  if (!removeButton) {
    return;
  }

  const optionIndex = Number(removeButton.dataset.optionIndex);
  options.splice(optionIndex, 1);
  showSetupMessage(options.length < 2 ? "Add at least 2 options to get started." : "");
  renderOptions();
  saveDraft();
}

// Display all setup options and update the start button.
function renderOptions() {
  optionsListElement.replaceChildren();

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    const listItem = document.createElement("li");
    const optionName = document.createElement("span");
    const removeButton = document.createElement("button");

    listItem.className = "option-item";
    optionName.className = "option-name";
    optionName.textContent = option;
    optionName.dir = "auto";
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.dataset.optionIndex = String(index);
    removeButton.setAttribute("aria-label", "Remove " + option);
    removeButton.textContent = "Remove";

    listItem.append(optionName, removeButton);
    optionsListElement.append(listItem);
  }

  optionCount.textContent = options.length + (options.length === 1 ? " option added" : " options added");
  startButton.disabled = options.length < 2;
  shuffleButton.disabled = options.length < 2;
}

// Show a friendly setup message without using a browser alert.
function showSetupMessage(message) {
  setupMessage.textContent = message;
}

// Switch to the wheel and prepare a fresh ranking.
function startRanking() {
  if (options.length < 2) {
    showSetupMessage("Add at least 2 options to get started.");
    return;
  }

  rankedOptions = [];
  originalOptions = options.slice();
  decisionName = getDecisionName();
  decisionNameInput.value = decisionName;
  decisionId = createDecisionId();
  historySaved = false;
  rotationAngle = 0;
  setupScreen.hidden = true;
  wheelScreen.hidden = false;
  finishedPanel.hidden = true;
  quickWinnerPanel.hidden = true;
  rankingSection.hidden = decisionMode === "quick";
  quickAgainButton.hidden = true;
  copyMessage.textContent = "";
  spinButton.hidden = false;
  spinButton.disabled = false;
  nextRankButton.hidden = true;
  wheelDecisionName.textContent = decisionName;
  wheelNote.textContent = decisionMode === "quick"
    ? "Spin again as often as you like."
    : "Every option gets a place in your ranking.";
  updateWheelHeading();
  renderResults();
  saveDraft();
  drawWheel();
}

// 3. Wheel drawing
// Draw a high-resolution canvas wheel with a label for every option.
window.addEventListener("resize", drawWheel);

// Draw all wheel slices and their option labels.
function drawWheel() {
  if (wheelScreen.hidden || options.length === 0) {
    return;
  }

  const bounds = wheelCanvas.getBoundingClientRect();
  if (bounds.width === 0) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  wheelCanvas.width = Math.round(bounds.width * pixelRatio);
  wheelCanvas.height = Math.round(bounds.height * pixelRatio);
  wheelContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;
  const radius = Math.min(centerX, centerY) * 0.94;
  const sliceAngle = (Math.PI * 2) / options.length;

  wheelContext.clearRect(0, 0, bounds.width, bounds.height);

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    const startAngle = rotationAngle + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    wheelContext.beginPath();
    wheelContext.moveTo(centerX, centerY);
    wheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
    wheelContext.closePath();
    wheelContext.fillStyle = getWheelColor(index);
    wheelContext.fill();
    wheelContext.strokeStyle = "rgba(255, 255, 255, 0.8)";
    wheelContext.lineWidth = Math.max(1, bounds.width * 0.004);
    wheelContext.stroke();
    drawWheelLabel(option, index, sliceAngle, centerX, centerY, radius);
  }

  wheelContext.beginPath();
  wheelContext.arc(centerX, centerY, radius * 0.075, 0, Math.PI * 2);
  wheelContext.fillStyle = "#ffffff";
  wheelContext.fill();
  wheelContext.strokeStyle = "rgba(32, 35, 58, 0.15)";
  wheelContext.lineWidth = Math.max(1, bounds.width * 0.004);
  wheelContext.stroke();
}

// Choose a different wheel color for every option, including large lists.
function getWheelColor(index) {
  if (index < wheelColors.length) {
    return wheelColors[index];
  }
  const hue = (index * 137.508) % 360;
  return "hsl(" + hue + ", 68%, 38%)";
}

// Place a short, readable label inside one wheel slice.
function drawWheelLabel(option, index, sliceAngle, centerX, centerY, radius) {
  const middleAngle = rotationAngle + (index + 0.5) * sliceAngle;
  const labelRadius = radius * 0.64;
  const availableWidth = Math.max(1, radius * 2 * Math.sin(sliceAngle / 2) * 0.82);
  const fontSize = Math.max(9, Math.min(20, radius * 0.095, availableWidth * 0.42));
  const label = trimCanvasText(option, availableWidth, fontSize);

  wheelContext.save();
  wheelContext.translate(centerX, centerY);
  wheelContext.rotate(middleAngle);
  wheelContext.textBaseline = "middle";
  wheelContext.font = "700 " + fontSize + "px system-ui, sans-serif";
  wheelContext.fillStyle = "#ffffff";
  wheelContext.shadowColor = "rgba(0, 0, 0, 0.24)";
  wheelContext.shadowBlur = Math.max(1, fontSize * 0.16);
  wheelContext.shadowOffsetY = Math.max(1, fontSize * 0.08);

  if (Math.cos(middleAngle) < 0) {
    // Left side: flip the text so it is not upside down, and keep it in the same slice
    wheelContext.rotate(Math.PI);
    wheelContext.textAlign = "left";
    wheelContext.fillText(label, -labelRadius, 0, availableWidth);
  } else {
    // Right side: draw the text normally
    wheelContext.textAlign = "right";
    wheelContext.fillText(label, labelRadius, 0, availableWidth);
  }

  wheelContext.restore();
}
// Shorten long labels until they fit inside a slice.
function trimCanvasText(text, maxWidth, fontSize) {
  wheelContext.font = "700 " + fontSize + "px system-ui, sans-serif";

  if (wheelContext.measureText(text).width <= maxWidth) {
    return text;
  }

  let shortText = text;
  while (shortText.length > 1 && wheelContext.measureText(shortText + "…").width > maxWidth) {
    shortText = shortText.slice(0, -1);
  }

  return shortText.length < text.length ? shortText + "…" : shortText;
}

// 4. Spinning
// Animate the wheel toward a randomly selected slice.
spinButton.addEventListener("click", startSpin);
nextRankButton.addEventListener("click", startSpin);
quickAgainButton.addEventListener("click", spinQuickAgain);
soundButton.addEventListener("click", toggleSound);
copyButton.addEventListener("click", copyResult);

// Start an eased spin and remember which slice will stop at the pointer.
function startSpin() {
  if (isSpinning || options.length < 2) {
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  nextRankButton.hidden = true;
  prepareAudio();

  const sliceAngle = (Math.PI * 2) / options.length;
  const winningIndex = Math.floor(Math.random() * options.length);
  const pointerAngle = -Math.PI / 2;
  const targetAngle = pointerAngle - (winningIndex + 0.5) * sliceAngle;
  const currentTurn = normalizeAngle(rotationAngle);
  const targetTurn = normalizeAngle(targetAngle);
  const angleToTarget = normalizeAngle(targetTurn - currentTurn);
  const startAngle = rotationAngle;
  const fullTurns = 5 + Math.floor(Math.random() * 5);
  const endAngle = startAngle + fullTurns * Math.PI * 2 + angleToTarget;
  const startTime = performance.now();
  const duration = 4200 + Math.random() * 900;

  // Update the wheel until the spin reaches its ending time.
  function animateSpin(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = easeOutCubic(progress);
    rotationAngle = startAngle + (endAngle - startAngle) * easedProgress;
    drawWheel();

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animateSpin);
      return;
    }

    rotationAngle = normalizeAngle(endAngle);
    drawWheel();
    animationFrameId = null;
    playDing();
    completeSpin(winningIndex);
  }

  animationFrameId = requestAnimationFrame(animateSpin);
}

// Slow the spin smoothly as it reaches the selected slice.
function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

// Keep an angle inside one full turn.
function normalizeAngle(angle) {
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

// 5. Results
// Add each winner to the ranking and finish when all are ranked.
restartButton.addEventListener("click", startOver);
editButton.addEventListener("click", editOptions);

// Record the winner, then prepare the next spin or finish the ranking.
function completeSpin(winningIndex) {
  if (decisionMode === "quick") {
    rankedOptions = [options[winningIndex]];
    renderResults();
    quickWinnerName.textContent = rankedOptions[0];
    quickWinnerPanel.hidden = false;
    finishRanking();
    return;
  }

  const winner = options.splice(winningIndex, 1)[0];
  rankedOptions.push(winner);
  isSpinning = false;
  renderResults();
  drawWheel();

  if (options.length === 1) {
    rankedOptions.push(options.pop());
    renderResults();
    finishRanking();
    return;
  }

  if (options.length === 0) {
    finishRanking();
    return;
  }

  spinButton.hidden = true;
  nextRankButton.textContent = "Spin for rank " + (rankedOptions.length + 1) + "?";
  nextRankButton.hidden = false;
  updateWheelHeading();
}

// Show the current ranking and how many results are complete.
function renderResults() {
  resultsListElement.replaceChildren();

  for (let index = 0; index < rankedOptions.length; index += 1) {
    const option = rankedOptions[index];
    const listItem = document.createElement("li");
    const rank = document.createElement("span");
    const name = document.createElement("span");

    listItem.className = "result-item";
    rank.className = "rank-number";
    rank.textContent = String(index + 1);
    rank.setAttribute("aria-label", "Rank " + (index + 1));
    name.className = "result-name";
    name.textContent = option;
    name.dir = "auto";
    listItem.append(rank, name);
    resultsListElement.append(listItem);
  }

  resultsCount.textContent = rankedOptions.length + " ranked";
}

// Update the wheel title to match the next rank.
function updateWheelHeading() {
  if (decisionMode === "quick") {
    wheelTitle.textContent = "Let the wheel pick one";
    wheelHint.textContent = options.length + " options are ready for a quick pick.";
    return;
  }

  wheelTitle.textContent = "Who gets rank " + (rankedOptions.length + 1) + "?";
  wheelHint.textContent = options.length + " " + (options.length === 1 ? "option remains." : "options remain.");
}

// Show the final actions and hide the spin controls.
function finishRanking() {
  isSpinning = false;
  spinButton.hidden = true;
  nextRankButton.hidden = true;
  saveHistoryEntry();
  finishedPanel.hidden = false;
  if (decisionMode === "quick") {
    finishedTitle.textContent = "Pick saved!";
    wheelTitle.textContent = "Your pick is made.";
    wheelHint.textContent = "Spin again or keep this result.";
    quickAgainButton.hidden = false;
    copyButton.hidden = false;
  } else {
    finishedTitle.textContent = "All ranked!";
    wheelTitle.textContent = "Your decision is made.";
    wheelHint.textContent = "Here is your complete ranking.";
    quickAgainButton.hidden = true;
    copyButton.hidden = false;
  }
}

// Clear the entire app and return to the empty setup screen.
function startOver() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  options = [];
  originalOptions = [];
  rankedOptions = [];
  decisionName = "";
  decisionMode = "full";
  decisionNameInput.value = "";
  modeInputs.forEach(function (modeInput) {
    modeInput.checked = modeInput.value === "full";
  });
  removeFromStorage(draftStorageKey);
  rotationAngle = 0;
  isSpinning = false;
  animationFrameId = null;
  historySaved = false;
  decisionId = "";
  quickWinnerPanel.hidden = true;
  rankingSection.hidden = false;
  copyButton.hidden = false;
  quickAgainButton.hidden = true;
  showSetupMessage("");
  optionInput.value = "";
  renderOptions();
  showSetupMessage("Add at least 2 options to get started.");
  renderResults();
  finishedPanel.hidden = true;
  wheelScreen.hidden = true;
  setupScreen.hidden = false;
}

// Return to setup with the original options ready to edit.
function editOptions() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  options = originalOptions.slice();
  rankedOptions = [];
  decisionNameInput.value = decisionName;
  rotationAngle = 0;
  isSpinning = false;
  animationFrameId = null;
  renderOptions();
  renderResults();
  finishedPanel.hidden = true;
  wheelScreen.hidden = true;
  setupScreen.hidden = false;
  showSetupMessage("");
  saveDraft();
  optionInput.focus();
}

// 6. Helpers
// Show the chosen name or a simple default.
function getDecisionName() {
  const typedName = decisionNameInput.value.trim();
  return typedName || "Untitled decision";
}

// Create a simple unique key for one finished decision.
function createDecisionId() {
  return Date.now().toString() + "-" + Math.random().toString(36).slice(2);
}

// 7. Saving data
// Save JSON data when local storage is available.
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    return false;
  }
  return true;
}

// Load JSON data or return the supplied default if it is missing or invalid.
function loadFromStorage(key, defaultValue) {
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue === null) {
      return defaultValue;
    }
    return JSON.parse(savedValue);
  } catch (error) {
    return defaultValue;
  }
}

// Remove one saved value without stopping the app if storage is blocked.
function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    return false;
  }
  return true;
}

// Keep the current setup choices in the saved draft.
function saveDraft() {
  decisionMode = getSelectedMode();
  const draft = {
    name: decisionNameInput.value,
    options: options.slice(),
    mode: decisionMode
  };
  saveToStorage(draftStorageKey, draft);
}

// Return the checked ranking mode.
function getSelectedMode() {
  for (let index = 0; index < modeInputs.length; index += 1) {
    if (modeInputs[index].checked) {
      return modeInputs[index].value;
    }
  }
  return "full";
}

// Restore saved setup values and user preferences at page load.
function initializeApp() {
  const savedDraft = loadFromStorage(draftStorageKey, null);
  if (isValidDraft(savedDraft)) {
    decisionNameInput.value = savedDraft.name;
    options = savedDraft.options.slice();
    decisionMode = savedDraft.mode;
  }

  modeInputs.forEach(function (modeInput) {
    modeInput.checked = modeInput.value === decisionMode;
  });

  const savedSound = loadFromStorage(soundStorageKey, true);
  soundEnabled = typeof savedSound === "boolean" ? savedSound : true;
  historyEntries = getValidHistory(loadFromStorage(historyStorageKey, []));

  renderOptions();
  renderTemplates();
  renderHistory();
  updateSoundButton();
  showSetupMessage(options.length < 2 ? "Add at least 2 options to get started." : "");
}

// Check every saved draft field before restoring any of it.
function isValidDraft(draft) {
  if (
    !draft ||
    typeof draft !== "object" ||
    typeof draft.name !== "string" ||
    !Array.isArray(draft.options) ||
    (draft.mode !== "quick" && draft.mode !== "full")
  ) {
    return false;
  }

  for (let index = 0; index < draft.options.length; index += 1) {
    if (typeof draft.options[index] !== "string" || draft.options[index].trim().length === 0) {
      return false;
    }
  }
  return true;
}

// Read the selected mode and save it with the current draft.
function changeMode() {
  decisionMode = getSelectedMode();
  saveDraft();
}

// 8. History
// Draw a button for every supplied quick-start template.
function renderTemplates() {
  templateButtons.replaceChildren();

  for (let index = 0; index < templates.length; index += 1) {
    const templateButton = document.createElement("button");
    templateButton.className = "button button-secondary template-button";
    templateButton.type = "button";
    templateButton.dataset.templateIndex = String(index);
    templateButton.textContent = templates[index].name;
    templateButtons.append(templateButton);
  }
}

// Replace the current draft with the selected template.
function useTemplate(event) {
  const templateButton = event.target.closest("[data-template-index]");
  if (!templateButton) {
    return;
  }

  const template = templates[Number(templateButton.dataset.templateIndex)];
  if (!template) {
    return;
  }

  decisionNameInput.value = template.name;
  options = template.options.slice();
  decisionMode = "full";
  modeInputs.forEach(function (modeInput) {
    modeInput.checked = modeInput.value === "full";
  });
  renderOptions();
  saveDraft();
  showSetupMessage("");
  showDraftMessage(template.name + " template loaded.");
  optionInput.focus();
}

// Shuffle the options and save the new order.
function shuffleOptions() {
  if (options.length < 2) {
    return;
  }

  options = shuffleArray(options);
  renderOptions();
  saveDraft();
  showDraftMessage("Options shuffled.");
}

// Return a shuffled copy using the Fisher-Yates method.
function shuffleArray(items) {
  const shuffledItems = items.slice();
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const savedItem = shuffledItems[index];
    shuffledItems[index] = shuffledItems[randomIndex];
    shuffledItems[randomIndex] = savedItem;
  }
  return shuffledItems;
}

// Show a short setup message for templates and shuffle actions.
function showDraftMessage(message) {
  draftMessage.textContent = message;
}

// Register one completed decision in the saved history.
function saveHistoryEntry() {
  if (historySaved || rankedOptions.length === 0) {
    return;
  }

  const historyEntry = {
    id: decisionId || createDecisionId(),
    name: decisionName || getDecisionName(),
    date: new Date().toLocaleString(),
    mode: decisionMode,
    options: originalOptions.slice(),
    ranking: rankedOptions.slice()
  };

  historyEntries.unshift(historyEntry);
  if (historyEntries.length > 20) {
    historyEntries = historyEntries.slice(0, 20);
  }
  saveToStorage(historyStorageKey, historyEntries);
  historySaved = true;
  renderHistory();
}

// Keep only well-formed history records from saved data.
function getValidHistory(savedHistory) {
  if (!Array.isArray(savedHistory)) {
    return [];
  }

  const validEntries = [];
  for (let index = 0; index < savedHistory.length && validEntries.length < 20; index += 1) {
    const entry = savedHistory[index];
    if (
      entry &&
      typeof entry.id === "string" &&
      typeof entry.name === "string" &&
      typeof entry.date === "string" &&
      (entry.mode === "full" || entry.mode === "quick") &&
      Array.isArray(entry.options) &&
      Array.isArray(entry.ranking) &&
      entry.options.every(function (option) { return typeof option === "string"; }) &&
      entry.ranking.every(function (option) { return typeof option === "string"; })
    ) {
      validEntries.push(entry);
    }
  }
  return validEntries;
}

// Draw history rows with actions to view, reuse, or delete each decision.
function renderHistory() {
  historyListElement.replaceChildren();
  historyMessage.textContent = historyEntries.length === 0 ? "Your saved decisions will appear here." : "";
  clearHistoryButton.hidden = historyEntries.length === 0;

  for (let index = 0; index < historyEntries.length; index += 1) {
    const entry = historyEntries[index];
    const listItem = document.createElement("li");
    const details = document.createElement("div");
    const name = document.createElement("h3");
    const date = document.createElement("p");
    const winner = document.createElement("p");
    const actions = document.createElement("div");

    listItem.className = "history-item";
    details.className = "history-details";
    name.className = "history-name";
    name.textContent = entry.name;
    name.dir = "auto";
    date.className = "muted";
    date.textContent = entry.date;
    winner.className = "history-winner";
    winner.textContent = "Winner: " + (entry.ranking[0] || "No winner");
    winner.dir = "auto";
    actions.className = "history-actions";

    actions.append(
      makeHistoryButton("View", "view", entry.id),
      makeHistoryButton("Use again", "use", entry.id),
      makeHistoryButton("Delete", "delete", entry.id)
    );
    details.append(name, date, winner);
    listItem.append(details, actions);
    historyListElement.append(listItem);
  }
}

// Create one labeled history action button.
function makeHistoryButton(label, action, id) {
  const button = document.createElement("button");
  button.className = "button button-secondary button-small";
  button.type = "button";
  button.dataset.historyAction = action;
  button.dataset.historyId = id;
  button.textContent = label;
  return button;
}

// Run the selected history action.
historyListElement.addEventListener("click", handleHistoryAction);

// Open a ranking, reuse its options, or delete the selected history item.
function handleHistoryAction(event) {
  const actionButton = event.target.closest("[data-history-action]");
  if (!actionButton) {
    return;
  }

  const entry = findHistoryEntry(actionButton.dataset.historyId);
  if (!entry) {
    return;
  }

  if (actionButton.dataset.historyAction === "view") {
    showHistoryEntry(entry);
  } else if (actionButton.dataset.historyAction === "use") {
    useHistoryEntry(entry);
  } else if (actionButton.dataset.historyAction === "delete") {
    deleteHistoryEntry(entry.id);
  }
}

// Find a saved decision using its unique id.
function findHistoryEntry(id) {
  for (let index = 0; index < historyEntries.length; index += 1) {
    if (historyEntries[index].id === id) {
      return historyEntries[index];
    }
  }
  return null;
}

// Show every ranked option for a selected history item.
function showHistoryEntry(entry) {
  historyViewerTitle.textContent = entry.name;
  historyViewerTitle.dir = "auto";
  historyViewerDate.textContent = entry.date + " · " + (entry.mode === "quick" ? "Quick pick" : "Full ranking");
  historyViewerList.replaceChildren();

  for (let index = 0; index < entry.ranking.length; index += 1) {
    const listItem = document.createElement("li");
    listItem.className = "history-result";
    listItem.textContent = (index + 1) + ". " + entry.ranking[index];
    listItem.dir = "auto";
    historyViewerList.append(listItem);
  }

  historyViewer.hidden = false;
  historyViewer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Load a saved decision into the setup form and save it as the new draft.
function useHistoryEntry(entry) {
  decisionNameInput.value = entry.name;
  options = entry.options.slice();
  decisionMode = entry.mode;
  modeInputs.forEach(function (modeInput) {
    modeInput.checked = modeInput.value === decisionMode;
  });
  renderOptions();
  saveDraft();
  showSetupMessage("");
  showDraftMessage("“" + entry.name + "” is ready to use again.");
  historyViewer.hidden = true;
  setupScreen.scrollIntoView({ behavior: "smooth", block: "start" });
  decisionNameInput.focus();
}

// Remove one selected decision from the history list.
function deleteHistoryEntry(id) {
  historyEntries = historyEntries.filter(function (entry) {
    return entry.id !== id;
  });
  saveToStorage(historyStorageKey, historyEntries);
  renderHistory();
  historyViewer.hidden = true;
}

// Ask for history deletion with an in-page confirmation step.
clearHistoryButton.addEventListener("click", showClearHistoryConfirmation);

// Show the extra confirmation buttons before clearing history.
function showClearHistoryConfirmation() {
  clearHistoryConfirmation.hidden = false;
  confirmClearHistoryButton.focus();
}

confirmClearHistoryButton.addEventListener("click", confirmClearHistory);

// Clear history only after the user presses the confirmation button.
function confirmClearHistory() {
  historyEntries = [];
  saveToStorage(historyStorageKey, historyEntries);
  clearHistoryConfirmation.hidden = true;
  historyViewer.hidden = true;
  renderHistory();
  historyMessage.textContent = "History cleared.";
}

cancelClearHistoryButton.addEventListener("click", cancelClearHistory);

// Close the history clear confirmation without deleting anything.
function cancelClearHistory() {
  clearHistoryConfirmation.hidden = true;
  clearHistoryButton.focus();
}

closeHistoryViewerButton.addEventListener("click", closeHistoryViewer);

// Hide the expanded history ranking.
function closeHistoryViewer() {
  historyViewer.hidden = true;
}

// 9. Extras
// Make another quick pick from the same complete set of options.
function spinQuickAgain() {
  rankedOptions = [];
  historySaved = false;
  decisionId = createDecisionId();
  quickWinnerPanel.hidden = true;
  finishedPanel.hidden = true;
  copyMessage.textContent = "";
  spinButton.hidden = false;
  spinButton.disabled = false;
  updateWheelHeading();
  drawWheel();
  startSpin();
}

// Save the sound choice and update the toggle label.
function toggleSound() {
  soundEnabled = !soundEnabled;
  saveToStorage(soundStorageKey, soundEnabled);
  updateSoundButton();
  if (soundEnabled) {
    prepareAudio();
  }
}

// Keep the sound button text and accessibility state in sync.
function updateSoundButton() {
  soundButton.querySelector("span").textContent = "Sound: " + (soundEnabled ? "On" : "Off");
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
}

// Create or resume audio only after the user starts a spin.
function prepareAudio() {
  if (!soundEnabled || audioContext) {
    return;
  }

  try {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }
    audioContext = new AudioContextConstructor();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(function () {});
    }
  } catch (error) {
    audioContext = null;
  }
}

// Play a short ding and vibrate when the wheel stops.
function playDing() {
  if (!soundEnabled) {
    return;
  }

  try {
    if (audioContext) {
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
      volume.gain.setValueAtTime(0.0001, audioContext.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.32);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.34);
    }

    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  } catch (error) {
    return;
  }
}

// Copy the complete decision ranking using the best available browser method.
async function copyResult() {
  const resultLines = ["Decision: " + decisionName];
  for (let index = 0; index < rankedOptions.length; index += 1) {
    resultLines.push((index + 1) + ". " + rankedOptions[index]);
  }
  const resultText = resultLines.join("\n");
  let copied = false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(resultText);
      copied = true;
    }
  } catch (error) {
    copied = false;
  }

  if (!copied) {
    copied = copyWithTemporaryTextArea(resultText);
  }

  copyMessage.textContent = copied ? "Copied!" : "Could not copy. Please select and copy the results.";
}

// Use a temporary text area if clipboard access is unavailable.
function copyWithTemporaryTextArea(text) {
  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.className = "hidden-copy-text";
  temporaryTextArea.value = text;
  temporaryTextArea.setAttribute("readonly", "");

  let copied = false;
  try {
    document.body.append(temporaryTextArea);
    temporaryTextArea.select();
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  } finally {
    temporaryTextArea.remove();
  }
  return copied;
}

// Restore the draft, templates, history, and preferences when the page opens.
initializeApp();

// 10. Progressive web app
// Show the install button only when the browser offers installation.
const installButton = document.getElementById("installButton");
let installPromptEvent = null;

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  installPromptEvent = event;
  installButton.hidden = false;
});

// Ask the browser to install the app after the user presses the button.
installButton.addEventListener("click", async function () {
  if (!installPromptEvent) {
    return;
  }

  try {
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    installPromptEvent = null;
    installButton.hidden = true;
  } catch (error) {
    console.log("The install prompt could not be opened.", error);
  }
});

// Register the service worker when this page is hosted on a website.
async function registerServiceWorker() {
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (error) {
    console.log("Offline support could not be enabled.", error);
  }
}

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  registerServiceWorker();
}

// Hide the install button after the app has been installed.
window.addEventListener("appinstalled", function () {
  installPromptEvent = null;
  installButton.hidden = true;
});
