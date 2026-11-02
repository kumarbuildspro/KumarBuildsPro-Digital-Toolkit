const tools = [
  {id:1,name:"Word Counter",category:"text",icon:"Aa",description:"Count words, characters and sentences."},
  {id:2,name:"Case Converter",category:"text",icon:"Aa",description:"Convert uppercase, lowercase and title case."},
  {id:3,name:"Text Reverser",category:"text",icon:"↔",description:"Reverse any text."},
  {id:4,name:"Remove Spaces",category:"text",icon:"␣",description:"Clean extra spaces from text."},
  {id:5,name:"Image Compressor",category:"image",icon:"▧",description:"Compress images in your browser."},
  {id:6,name:"Image Resizer",category:"image",icon:"↗",description:"Resize images to custom dimensions."},
  {id:7,name:"Image Converter",category:"image",icon:"◈",description:"Convert images to PNG, JPEG or WebP."},
  {id:8,name:"Image Cropper",category:"image",icon:"▣",description:"Crop an image using custom dimensions."},
  {id:9,name:"Age Calculator",category:"calculator",icon:"♙",description:"Calculate age from date of birth."},
  {id:10,name:"Percentage Calculator",category:"calculator",icon:"%",description:"Calculate percentages easily."},
  {id:11,name:"Grade Calculator",category:"calculator",icon:"A+",description:"Calculate percentage and grade from marks."},
  {id:12,name:"Unit Converter",category:"calculator",icon:"⇄",description:"Convert common length and weight units."},
  {id:13,name:"JSON Formatter",category:"developer",icon:"{ }",description:"Format and validate JSON."},
  {id:14,name:"HTML Formatter",category:"developer",icon:"</>",description:"Format HTML code."},
  {id:15,name:"CSS Minifier",category:"developer",icon:"#",description:"Minify CSS code."},
  {id:16,name:"Base64 Converter",category:"developer",icon:"64",description:"Encode and decode Base64 text."},
  {id:17,name:"Password Generator",category:"generator",icon:"✧",description:"Generate a random password."},
  {id:18,name:"QR Code Generator",category:"generator",icon:"▦",description:"Create QR codes from text or links."},
  {id:19,name:"UUID Generator",category:"generator",icon:"◇",description:"Generate unique IDs."},
  {id:20,name:"Lorem Ipsum",category:"generator",icon:"¶",description:"Generate placeholder text."},
  {id:21,name:"To-Do List",category:"productivity",icon:"✓",description:"Manage your daily tasks."},
  {id:22,name:"Notes Manager",category:"productivity",icon:"▤",description:"Save notes in your browser."},
  {id:23,name:"Pomodoro Timer",category:"productivity",icon:"◷",description:"Focus with a work timer."},
  {id:24,name:"Daily Planner",category:"productivity",icon:"▦",description:"Plan your daily activities."}
];

const $ = selector => document.querySelector(selector);

function getData(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#039;"
  })[char]);
}

let favorites = getData("kumar_favorites");
let history = getData("kumar_history");
let currentCategory = "all";
let currentSearch = "";
let toastTimer;
let timerInterval = null;
let timerSeconds = 25 * 60;

const pageTitles = {
  dashboard:["Dashboard","Welcome to your professional workspace."],
  "all-tools":["All Tools","Explore all available digital utilities."],
  favorites:["Favorites","Your saved tools in one place."],
  history:["Recent History","Your recently opened tools."],
  settings:["Settings","Manage your workspace preferences."],
  about:["About","Learn more about Kumar Tools."]
};

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

// Navigation

function navigate(page) {
  const target = document.getElementById(page);
  if (!target) return;

  document.querySelectorAll(".page").forEach(item => {
    item.classList.remove("active");
  });

  target.classList.add("active");

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (pageTitles[page]) {
    $("#pageTitle").textContent = pageTitles[page][0];
    $("#pageSubtitle").textContent = pageTitles[page][1];
  }

  $("#searchInput").value = "";
  currentSearch = "";

  if (page === "all-tools") {
    currentCategory = "all";
    updateFilterButtons();
    renderAllTools();
  }

  if (page === "favorites") renderFavorites();
  if (page === "history") renderHistory();

  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

// Tool Cards

function createToolCard(tool) {
  const saved = favorites.includes(tool.id);

  return `
    <article class="tool-card">
      <div class="tool-top">
        <div class="tool-icon">${escapeHTML(tool.icon)}</div>
        <button class="favorite-btn ${saved ? "saved" : ""}"
          data-favorite="${tool.id}" aria-label="Toggle favorite">
          ${saved ? "★" : "☆"}
        </button>
      </div>

      <h3>${escapeHTML(tool.name)}</h3>
      <p>${escapeHTML(tool.description)}</p>

      <div class="tool-bottom">
        <span class="tool-category">${escapeHTML(tool.category)}</span>
        <button class="tool-open-btn" data-open-tool="${tool.id}">
          Open Tool →
        </button>
      </div>
    </article>
  `;
}

function renderPopularTools() {
  $("#popularTools").innerHTML = tools.slice(0,6).map(createToolCard).join("");
}

function renderAllTools() {
  const filtered = tools.filter(tool => {
    const categoryMatch =
      currentCategory === "all" || tool.category === currentCategory;

    const searchText =
      `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();

    return categoryMatch && searchText.includes(currentSearch.toLowerCase());
  });

  $("#allToolsGrid").innerHTML = filtered.map(createToolCard).join("");
  $("#noTools").classList.toggle("hidden", filtered.length > 0);
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === currentCategory
    );
  });
}

function openCategory(category) {
  navigate("all-tools");
  currentCategory = category;
  updateFilterButtons();
  renderAllTools();
}

// Favorites

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(item => item !== id);
    showToast("Removed from favorites");
  } else {
    favorites.push(id);
    showToast("Added to favorites");
  }

  saveData("kumar_favorites", favorites);
  refreshCards();
}

function renderFavorites() {
  const list = tools.filter(tool => favorites.includes(tool.id));
  $("#favoriteToolsGrid").innerHTML = list.map(createToolCard).join("");
  $("#noFavorites").classList.toggle("hidden", list.length > 0);
}

function refreshCards() {
  renderPopularTools();
  renderAllTools();
  renderFavorites();
  updateStats();
}

// History

function addToHistory(id) {
  history = history.filter(item => item.id !== id);
  history.unshift({id,time:new Date().toISOString()});
  history = history.slice(0,30);

  saveData("kumar_history",history);
  updateStats();
}

function renderHistory() {
  const valid = history.map(item => ({
    ...item,
    tool:tools.find(tool => tool.id === item.id)
  })).filter(item => item.tool);

  $("#historyList").innerHTML = valid.map(item => `
    <div class="history-item">
      <div class="tool-icon">${escapeHTML(item.tool.icon)}</div>
      <div>
        <h3>${escapeHTML(item.tool.name)}</h3>
        <p>${escapeHTML(item.tool.category)}</p>
      </div>
      <span class="history-time">
        ${new Date(item.time).toLocaleString()}
      </span>
    </div>
  `).join("");

  $("#noHistory").classList.toggle("hidden",valid.length > 0);
}

function updateStats() {
  $("#totalTools").textContent = tools.length;
  $("#favoriteCount").textContent = favorites.length;
  $("#historyCount").textContent = history.length;
}

// Theme

function applyTheme(theme) {
  document.body.classList.toggle("light",theme === "light");
  localStorage.setItem("kumar_theme",theme);
  $("#themeToggle").textContent = theme === "light" ? "☾" : "☀";
}

function toggleTheme() {
  const next = document.body.classList.contains("light") ? "dark" : "light";
  applyTheme(next);
  showToast(next === "light" ? "Light mode enabled" : "Dark mode enabled");
}

// Dynamic Tool Window

function createToolWindow() {
  if ($("#toolModal")) return;

  document.body.insertAdjacentHTML("beforeend",`
    <div class="tool-modal hidden" id="toolModal">
      <div class="tool-modal-box">
        <div class="tool-modal-header">
          <div>
            <span class="modal-small">KUMAR TOOLS</span>
            <h2 id="modalTitle">Tool</h2>
          </div>
          <button id="closeTool" class="modal-close" aria-label="Close">×</button>
        </div>
        <div class="tool-modal-content" id="modalContent"></div>
      </div>
    </div>
  `);

  $("#closeTool").addEventListener("click",closeTool);
  $("#toolModal").addEventListener("click",event => {
    if (event.target.id === "toolModal") closeTool();
  });
}

function closeTool() {
  stopTimer();
  $("#toolModal").classList.add("hidden");
}

function field(label,id,placeholder="",type="text") {
  return `
    <label class="tool-label" for="${id}">${label}</label>
    <input class="tool-input" id="${id}" type="${type}"
      placeholder="${escapeHTML(placeholder)}">
  `;
}

function area(label,id,placeholder="Enter text here...") {
  return `
    <label class="tool-label" for="${id}">${label}</label>
    <textarea class="tool-textarea" id="${id}"
      placeholder="${escapeHTML(placeholder)}"></textarea>
  `;
}

function actionButton(label,id="runTool") {
  return `<button class="tool-action" id="${id}">${label}</button>`;
}

function outputBox(id="toolOutput") {
  return `<div class="tool-output" id="${id}">Your result will appear here.</div>`;
}

function openTool(id) {
  const tool = tools.find(item => item.id === id);
  if (!tool) return;

  createToolWindow();
  stopTimer();

  $("#modalTitle").textContent = tool.name;
  $("#modalContent").innerHTML = getToolInterface(id);
  $("#toolModal").classList.remove("hidden");

  addToHistory(id);
  updateStats();
  setupTool(id);
}

// Tool Interfaces

function getToolInterface(id) {
  switch(id) {
    case 1:
      return area("Your text","textInput") +
        `<div class="tool-result-grid">
          <div class="mini-result">Words <strong id="wordCount">0</strong></div>
          <div class="mini-result">Characters <strong id="charCount">0</strong></div>
          <div class="mini-result">No spaces <strong id="noSpaceCount">0</strong></div>
          <div class="mini-result">Sentences <strong id="sentenceCount">0</strong></div>
        </div>`;

    case 2:
      return area("Your text","textInput") +
        `<div class="tool-button-row">
          <button class="tool-action" data-case="upper">UPPERCASE</button>
          <button class="tool-action" data-case="lower">lowercase</button>
          <button class="tool-action" data-case="title">Title Case</button>
          <button class="tool-action" data-case="sentence">Sentence case</button>
        </div>` + outputBox();

    case 3:
      return area("Your text","textInput") +
        actionButton("Reverse Text") + outputBox();

    case 4:
      return area("Your text","textInput") +
        `<div class="tool-button-row">
          <button class="tool-action" id="removeExtra">Remove Extra Spaces</button>
          <button class="tool-action" id="removeAll">Remove All Spaces</button>
        </div>` + outputBox();

    case 5:
      return `
        <p class="tool-help">Choose an image. Compression happens in your browser.</p>
        ${field("Select image","imageFile","","file")}
        ${field("Image quality (0.1–1)","imageQuality","0.7","number")}
        ${outputBox()}
        ${actionButton("Compress & Download")}`;

    case 6:
      return `
        ${field("Select image","imageFile","","file")}
        ${field("Width in pixels","imageWidth","800","number")}
        ${field("Height in pixels","imageHeight","600","number")}
        <label class="tool-check"><input type="checkbox" id="keepRatio" checked> Keep aspect ratio</label>
        ${actionButton("Resize & Download")}
        ${outputBox()}`;

    case 7:
      return `
        ${field("Select image","imageFile","","file")}
        <label class="tool-label">Output format</label>
        <select class="tool-input" id="imageFormat">
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select>
        ${actionButton("Convert & Download")}
        ${outputBox()}`;

    case 8:
      return `
        ${field("Select image","imageFile","","file")}
        ${field("X position","cropX","0","number")}
        ${field("Y position","cropY","0","number")}
        ${field("Crop width","cropW","300","number")}
        ${field("Crop height","cropH","300","number")}
        ${actionButton("Crop & Download")}
        ${outputBox()}`;

    case 9:
      return `
        ${field("Date of birth","birthDate","","date")}
        ${actionButton("Calculate Age")}
        ${outputBox()}`;

    case 10:
      return `
        ${field("Percentage (%)","percentValue","20","number")}
        ${field("Number","percentTotal","500","number")}
        ${actionButton("Calculate")}
        ${outputBox()}`;

    case 11:
      return `
        ${field("Total marks","totalMarks","500","number")}
        ${field("Marks obtained","obtainedMarks","400","number")}
        ${actionButton("Calculate Result")}
        ${outputBox()}`;

    case 12:
      return `
        <label class="tool-label">Conversion type</label>
        <select class="tool-input" id="unitType">
          <option value="length">Length</option>
          <option value="weight">Weight</option>
          <option value="temperature">Temperature</option>
        </select>
        ${field("Value","unitValue","100","number")}
        <label class="tool-label">From</label>
        <select class="tool-input" id="unitFrom"></select>
        <label class="tool-label">To</label>
        <select class="tool-input" id="unitTo"></select>
        ${actionButton("Convert")}
        ${outputBox()}`;

    case 13:
      return area("JSON input","codeInput") +
        actionButton("Format JSON") + outputBox();

    case 14:
      return area("HTML input","codeInput") +
        actionButton("Format HTML") + outputBox();

    case 15:
      return area("CSS input","codeInput") +
        actionButton("Minify CSS") + outputBox();

    case 16:
      return area("Enter text or Base64","codeInput") +
        `<div class="tool-button-row">
          <button class="tool-action" id="baseEncode">Encode</button>
          <button class="tool-action" id="baseDecode">Decode</button>
        </div>` + outputBox();

    case 17:
      return `
        ${field("Password length","passLength","16","number")}
        <label class="tool-check"><input type="checkbox" id="passUpper" checked> Uppercase letters</label>
        <label class="tool-check"><input type="checkbox" id="passLower" checked> Lowercase letters</label>
        <label class="tool-check"><input type="checkbox" id="passNumbers" checked> Numbers</label>
        <label class="tool-check"><input type="checkbox" id="passSymbols" checked> Symbols</label>
        ${actionButton("Generate Password")}
        ${outputBox()}`;

    case 18:
      return `
        ${field("Text or URL","qrText","https://example.com")}
        ${actionButton("Generate QR Code")}
        <div class="qr-result" id="qrResult"></div>
        <p class="tool-help">QR image service requires an internet connection.</p>`;

    case 19:
      return `
        ${field("Number of UUIDs","uuidCount","5","number")}
        ${actionButton("Generate UUIDs")}
        ${outputBox()}`;

    case 20:
      return `
        ${field("Number of paragraphs","loremCount","3","number")}
        ${actionButton("Generate Lorem Ipsum")}
        ${outputBox()}`;

    case 21:
      return `
        ${field("New task","todoInput","Enter a task")}
        ${actionButton("Add Task")}
        <div id="todoList" class="todo-list"></div>`;

    case 22:
      return `
        ${field("Note title","noteTitle","My Note")}
        ${area("Note content","noteContent")}
        <div class="tool-button-row">
          <button class="tool-action" id="saveNote">Save Note</button>
          <button class="tool-action secondary-action" id="newNote">New Note</button>
        </div>
        <div id="notesList" class="notes-list"></div>`;

    case 23:
      return `
        <div class="timer-display" id="timerDisplay">25:00</div>
        <div class="tool-button-row">
          <button class="tool-action" id="startTimer">Start</button>
          <button class="tool-action secondary-action" id="pauseTimer">Pause</button>
          <button class="tool-action secondary-action" id="resetTimer">Reset</button>
        </div>
        <p class="tool-help">Focus session: 25 minutes. Take a break when finished.</p>`;

    case 24:
      return `
        ${field("Choose date","plannerDate","","date")}
        ${field("Today's main goal","plannerGoal","What do you want to achieve?")}
        ${area("Your plan","plannerContent","Write your daily plan...")}
        ${actionButton("Save Daily Plan")}
        <div id="plannerSaved" class="tool-output"></div>`;
  }
}

// Tool Setup

function setupTool(id) {
  const run = $("#runTool");

  if (run) run.addEventListener("click",runTool);

  if (id === 1) {
    $("#textInput").addEventListener("input",updateWordCounts);
  }

  if (id === 2) {
    document.querySelectorAll("[data-case]").forEach(button => {
      button.addEventListener("click",() => {
        const text = $("#textInput").value;
        const type = button.dataset.case;

        let result = text;

        if (type === "upper") result = text.toUpperCase();
        if (type === "lower") result = text.toLowerCase();
        if (type === "title") {
          result = text.toLowerCase().replace(/\b\w/g,char => char.toUpperCase());
        }
        if (type === "sentence") {
          result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,char => char.toUpperCase());
        }

        showOutput(result);
      });
    });
  }

  if (id === 4) {
    $("#removeExtra").addEventListener("click",() => {
      showOutput($("#textInput").value.trim().replace(/\s+/g," "));
    });

    $("#removeAll").addEventListener("click",() => {
      showOutput($("#textInput").value.replace(/\s/g,""));
    });
  }

  if (id === 12) {
    $("#unitType").addEventListener("change",updateUnitOptions);
    updateUnitOptions();
  }

  if (id === 16) {
    $("#baseEncode").addEventListener("click",() => {
      try {
        showOutput(btoa(unescape(encodeURIComponent($("#codeInput").value))));
      } catch {
        showOutput("Could not encode this text.");
      }
    });

    $("#baseDecode").addEventListener("click",() => {
      try {
        showOutput(decodeURIComponent(escape(atob($("#codeInput").value.trim()))));
      } catch {
        showOutput("Invalid Base64 input.");
      }
    });
  }

  if (id === 21) renderTodos();
  if (id === 22) renderNotes();

  if (id === 23) {
    updateTimerDisplay();
    $("#startTimer").addEventListener("click",startTimer);
    $("#pauseTimer").addEventListener("click",stopTimer);
    $("#resetTimer").addEventListener("click",resetTimer);
  }

  if (id === 24) loadPlanner();
}

function showOutput(value) {
  const output = $("#toolOutput");
  if (output) {
    output.textContent = String(value);
  }
}

function updateWordCounts() {
  const text = $("#textInput").value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  $("#wordCount").textContent = words;
  $("#charCount").textContent = text.length;
  $("#noSpaceCount").textContent = text.replace(/\s/g,"").length;
  $("#sentenceCount").textContent =
    (text.match(/[.!?]+/g) || []).length;
}

// Image Helpers

function loadImage() {
  return new Promise((resolve,reject) => {
    const file = $("#imageFile")?.files?.[0];

    if (!file) {
      showOutput("Please select an image first.");
      reject(new Error("No image selected"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      showOutput("Please select a valid image file.");
      reject(new Error("Invalid image"));
      return;
    }

    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({image,file});
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be opened"));
    };

    image.src = url;
  });
}

function downloadCanvas(canvas,type="image/png",quality=.9) {
  canvas.toBlob(blob => {
    if (!blob) {
      showOutput("Could not create image. Try another format.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kumar-tools-${Date.now()}.${type.split("/")[1] || "png"}`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url),1000);
    showOutput("Image downloaded successfully.");
  },type,quality);
}

async function imageTool(id) {
  try {
    const {image,file} = await loadImage();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (id === 5) {
      const quality = Math.max(.1,Math.min(1,Number($("#imageQuality").value) || .7));
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image,0,0);
      downloadCanvas(canvas,"image/jpeg",quality);
    }

    if (id === 6) {
      let width = Number($("#imageWidth").value);
      let height = Number($("#imageHeight").value);

      if (width <= 0 || height <= 0) {
        showOutput("Enter valid width and height.");
        return;
      }

      if ($("#keepRatio").checked) {
        const ratio = image.width / image.height;
        if (width / height > ratio) width = Math.round(height * ratio);
        else height = Math.round(width / ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image,0,0,width,height);
      downloadCanvas(canvas,"image/png");
    }

    if (id === 7) {
      const format = $("#imageFormat").value;
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image,0,0);
      downloadCanvas(canvas,format,.92);
    }

    if (id === 8) {
      const x = Math.max(0,Number($("#cropX").value) || 0);
      const y = Math.max(0,Number($("#cropY").value) || 0);
      const width = Number($("#cropW").value);
      const height = Number($("#cropH").value);

      if (width <= 0 || height <= 0 || x >= image.width || y >= image.height) {
        showOutput("Enter valid crop dimensions and position.");
        return;
      }

      const cropWidth = Math.min(width,image.width-x);
      const cropHeight = Math.min(height,image.height-y);

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(image,x,y,cropWidth,cropHeight,0,0,cropWidth,cropHeight);
      downloadCanvas(canvas,"image/png");
    }

    showToast("Image processing complete");
  } catch(error) {
    if (error.message !== "No image selected" && error.message !== "Invalid image") {
      showOutput("Could not process image. Try another file.");
    }
  }
}

// Unit Converter

const unitOptions = {
  length: {
    m:1,km:1000,cm:.01,mm:.001,ft:.3048,in:.0254
  },
  weight: {
    kg:1,g:.001,mg:.000001,lb:.453592,oz:.0283495
  }
};

function updateUnitOptions() {
  const type = $("#unitType").value;
  let options;

  if (type === "temperature") {
    options = ["Celsius","Fahrenheit","Kelvin"];
  } else {
    options = Object.keys(unitOptions[type]);
  }

  $("#unitFrom").innerHTML = options.map(x => `<option>${x}</option>`).join("");
  $("#unitTo").innerHTML = options.map(x => `<option>${x}</option>`).join("");
  if (options.length > 1) $("#unitTo").selectedIndex = 1;
}

function convertTemperature(value,from,to) {
  let celsius = value;

  if (from === "Fahrenheit") celsius = (value-32)*5/9;
  if (from === "Kelvin") celsius = value-273.15;

  if (to === "Fahrenheit") return celsius*9/5+32;
  if (to === "Kelvin") return celsius+273.15;

  return celsius;
}

// Main Tool Actions

function runTool() {
  const id = Number(tools.find(tool =>
    tool.name === $("#modalTitle").textContent
  )?.id);

  if ([5,6,7,8].includes(id)) {
    imageTool(id);
    return;
  }

  switch(id) {
    case 3:
      showOutput([...$("#textInput").value].reverse().join(""));
      break;

    case 9: {
      const birth = new Date($("#birthDate").value + "T00:00:00");
      const today = new Date();

      if (!$("#birthDate").value || Number.isNaN(birth.getTime()) || birth > today) {
        showOutput("Please enter a valid past date.");
        break;
      }

      let years = today.getFullYear()-birth.getFullYear();
      let months = today.getMonth()-birth.getMonth();
      let days = today.getDate()-birth.getDate();

      if (days < 0) {
        months--;
        days += new Date(today.getFullYear(),today.getMonth(),0).getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      showOutput(`${years} years, ${months} months and ${days} days`);
      break;
    }

    case 10: {
      const percent = Number($("#percentValue").value);
      const total = Number($("#percentTotal").value);

      if (!Number.isFinite(percent) || !Number.isFinite(total)) {
        showOutput("Enter valid numbers.");
        break;
      }

      showOutput(`${percent}% of ${total} = ${(percent*total/100).toFixed(2)}`);
      break;
    }

    case 11: {
      const total = Number($("#totalMarks").value);
      const obtained = Number($("#obtainedMarks").value);

      if (total <= 0 || obtained < 0 || obtained > total) {
        showOutput("Enter valid marks. Obtained marks cannot exceed total marks.");
        break;
      }

      const percent = obtained/total*100;
      let grade = "F";

      if (percent >= 90) grade = "A+";
      else if (percent >= 80) grade = "A";
      else if (percent >= 70) grade = "B";
      else if (percent >= 60) grade = "C";
      else if (percent >= 50) grade = "D";

      showOutput(`Percentage: ${percent.toFixed(2)}%\nGrade: ${grade}`);
      break;
    }

    case 12: {
      const value = Number($("#unitValue").value);
      const from = $("#unitFrom").value;
      const to = $("#unitTo").value;
      const type = $("#unitType").value;

      if (!Number.isFinite(value)) {
        showOutput("Enter a valid number.");
        break;
      }

      let result;

      if (type === "temperature") {
        result = convertTemperature(value,from,to);
      } else {
        result = value*unitOptions[type][from]/unitOptions[type][to];
      }

      showOutput(`${value} ${from} = ${result.toFixed(4)} ${to}`);
      break;
    }

    case 13:
      try {
        const parsed = JSON.parse($("#codeInput").value);
        showOutput(JSON.stringify(parsed,null,2));
      } catch(error) {
        showOutput("Invalid JSON: " + error.message);
      }
      break;

    case 14: {
      const html = $("#codeInput").value;
      const formatted = html
        .replace(/>\s*</g,">\n<")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .join("\n");

      showOutput(formatted);
      break;
    }

    case 15: {
      const css = $("#codeInput").value
        .replace(/\/\*[\s\S]*?\*\//g,"")
        .replace(/\s+/g," ")
        .replace(/\s*([{}:;,])\s*/g,"$1")
        .replace(/;}/g,"}");

      showOutput(css.trim());
      break;
    }

    case 17: {
      const length = Math.floor(Number($("#passLength").value));

      if (length < 8 || length > 128) {
        showOutput("Choose a password length between 8 and 128.");
        break;
      }

      let chars = "";
      if ($("#passUpper").checked) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if ($("#passLower").checked) chars += "abcdefghijklmnopqrstuvwxyz";
      if ($("#passNumbers").checked) chars += "0123456789";
      if ($("#passSymbols").checked) chars += "!@#$%^&*()-_=+";

      if (!chars) {
        showOutput("Select at least one character type.");
        break;
      }

      const random = new Uint32Array(length);
      crypto.getRandomValues(random);

      const password = Array.from(random,value => chars[value % chars.length]).join("");
      showOutput(password);
      break;
    }

    case 18: {
      const value = $("#qrText").value.trim();

      if (!value) {
        showToast("Enter text or a URL first.");
        break;
      }

      const image = document.createElement("img");
      image.alt = "Generated QR Code";
      image.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
        encodeURIComponent(value);

      const result = $("#qrResult");
      result.replaceChildren(image);

      const link = document.createElement("a");
      link.href = image.src;
      link.download = "kumar-tools-qr.png";
      link.textContent = "Open QR image";
      link.target = "_blank";
      result.appendChild(link);
      break;
    }

    case 19: {
      const count = Math.floor(Number($("#uuidCount").value));

      if (count < 1 || count > 50) {
        showOutput("Choose between 1 and 50 UUIDs.");
        break;
      }

      showOutput(Array.from({length:count},() => crypto.randomUUID()).join("\n"));
      break;
    }

    case 20: {
      const count = Math.floor(Number($("#loremCount").value));

      if (count < 1 || count > 20) {
        showOutput("Choose between 1 and 20 paragraphs.");
        break;
      }

      const sample = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      showOutput(Array.from({length:count},() => sample).join("\n\n"));
      break;
    }

    case 21:
      addTodo();
      break;

    case 22:
      saveNote();
      break;

    case 24:
      savePlanner();
      break;
  }
}

// To-Do List

function renderTodos() {
  const list = getData("kumar_todos");

  $("#todoList").innerHTML = list.map((item,index) => `
    <div class="todo-item">
      <label>
        <input type="checkbox" data-todo-check="${index}" ${item.done ? "checked" : ""}>
        <span class="${item.done ? "todo-done" : ""}">${escapeHTML(item.text)}</span>
      </label>
      <button data-todo-delete="${index}">×</button>
    </div>
  `).join("");

  $("#todoList").querySelectorAll("[data-todo-check]").forEach(input => {
    input.addEventListener("change",() => {
      const items = getData("kumar_todos");
      items[Number(input.dataset.todoCheck)].done = input.checked;
      saveData("kumar_todos",items);
      renderTodos();
    });
  });

  $("#todoList").querySelectorAll("[data-todo-delete]").forEach(button => {
    button.addEventListener("click",() => {
      const items = getData("kumar_todos");
      items.splice(Number(button.dataset.todoDelete),1);
      saveData("kumar_todos",items);
      renderTodos();
    });
  });
}

function addTodo() {
  const input = $("#todoInput");
  const text = input.value.trim();

  if (!text) {
    showToast("Enter a task first.");
    return;
  }

  const items = getData("kumar_todos");
  items.push({text,done:false});
  saveData("kumar_todos",items);

  input.value = "";
  renderTodos();
  showToast("Task added");
}

// Notes Manager

function renderNotes() {
  const notes = getData("kumar_notes");

  $("#notesList").innerHTML = notes.map((note,index) => `
    <div class="note-item">
      <div>
        <strong>${escapeHTML(note.title)}</strong>
        <p>${escapeHTML(note.content.slice(0,100))}</p>
      </div>
      <div class="note-actions">
        <button data-note-edit="${index}">Edit</button>
        <button data-note-delete="${index}">Delete</button>
      </div>
    </div>
  `).join("");

  $("#notesList").querySelectorAll("[data-note-edit]").forEach(button => {
    button.addEventListener("click",() => {
      const note = notes[Number(button.dataset.noteEdit)];
      $("#noteTitle").value = note.title;
      $("#noteContent").value = note.content;
    });
  });

  $("#notesList").querySelectorAll("[data-note-delete]").forEach(button => {
    button.addEventListener("click",() => {
      const updated = getData("kumar_notes");
      updated.splice(Number(button.dataset.noteDelete),1);
      saveData("kumar_notes",updated);
      renderNotes();
    });
  });

  $("#saveNote").onclick = saveNote;
  $("#newNote").onclick = () => {
    $("#noteTitle").value = "";
    $("#noteContent").value = "";
  };
}

function saveNote() {
  const title = $("#noteTitle").value.trim();
  const content = $("#noteContent").value.trim();

  if (!title || !content) {
    showToast("Enter a title and note.");
    return;
  }

  const notes = getData("kumar_notes");
  const existing = notes.findIndex(note => note.title === title);

  if (existing >= 0) notes[existing] = {title,content};
  else notes.unshift({title,content});

  saveData("kumar_notes",notes);
  renderNotes();
  showToast("Note saved");
}

// Pomodoro Timer

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds/60);
  const seconds = timerSeconds%60;

  if ($("#timerDisplay")) {
    $("#timerDisplay").textContent =
      `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  }
}

function startTimer() {
  if (timerInterval) return;

  if (timerSeconds <= 0) timerSeconds = 25*60;

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      stopTimer();
      showToast("Focus session complete! Take a break.");
    }
  },1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  timerSeconds = 25*60;
  updateTimerDisplay();
}

// Daily Planner

function loadPlanner() {
  const date = new Date().toISOString().slice(0,10);
  $("#plannerDate").value = date;

  showPlannerForDate();
  $("#plannerDate").addEventListener("change",showPlannerForDate);
}

function showPlannerForDate() {
  const plans = getData("kumar_plans");
  const plan = plans[$("#plannerDate").value];

  $("#plannerGoal").value = plan?.goal || "";
  $("#plannerContent").value = plan?.content || "";

  $("#plannerSaved").textContent = plan
    ? "Saved plan loaded for this date."
    : "No saved plan for this date yet.";
}

function savePlanner() {
  const date = $("#plannerDate").value;

  if (!date) {
    showToast("Choose a date.");
    return;
  }

  const plans = getData("kumar_plans");

  plans[date] = {
    goal:$("#plannerGoal").value,
    content:$("#plannerContent").value
  };

  saveData("kumar_plans",plans);
  showToast("Daily plan saved");
  showPlannerForDate();
}

// Search

$("#searchInput").addEventListener("input",event => {
  currentSearch = event.target.value.trim();

  if (!$("#all-tools").classList.contains("active")) {
    navigate("all-tools");
    currentSearch = event.target.value.trim();
    $("#searchInput").value = currentSearch;
  }

  renderAllTools();
});

// Global Click Events

document.addEventListener("click",event => {
  const page = event.target.closest("[data-page]");
  if (page) {
    navigate(page.dataset.page);
    return;
  }

  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    toggleFavorite(Number(favorite.dataset.favorite));
    return;
  }

  const filter = event.target.closest(".filter-btn");
  if (filter) {
    currentCategory = filter.dataset.category;
    updateFilterButtons();
    renderAllTools();
    return;
  }

  const category = event.target.closest("[data-open-category]");
  if (category) {
    openCategory(category.dataset.openCategory);
    return;
  }

  const open = event.target.closest("[data-open-tool]");
  if (open) {
    openTool(Number(open.dataset.openTool));
  }
});

// Sidebar

$("#menuToggle").addEventListener("click",() => {
  $("#sidebar").classList.toggle("open");
});

// Theme Controls

$("#themeToggle").addEventListener("click",toggleTheme);
$("#settingsTheme").addEventListener("click",toggleTheme);

$("#resetSettings").addEventListener("click",() => {
  applyTheme("dark");
  showToast("Default theme restored");
});

// Clear History

$("#clearHistory").addEventListener("click",() => {
  if (!history.length) {
    showToast("History is already empty");
    return;
  }

  if (confirm("Clear all recent history?")) {
    history = [];
    saveData("kumar_history",history);
    renderHistory();
    updateStats();
    showToast("History cleared");
  }
});

// Clear Favorites

$("#clearFavorites").addEventListener("click",() => {
  if (!favorites.length) {
    showToast("Favorites are already empty");
    return;
  }

  if (confirm("Clear all favorites?")) {
    favorites = [];
    saveData("kumar_favorites",favorites);
    refreshCards();
    showToast("Favorites cleared");
  }
});

// Initialize

function initApp() {
  applyTheme(localStorage.getItem("kumar_theme") || "dark");
  renderPopularTools();
  renderAllTools();
  updateStats();
  navigate("dashboard");
}

initApp();
