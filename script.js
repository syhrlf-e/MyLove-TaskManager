import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgryecBphpQEcMax0BU5lNcUNCVQzkuGQ",
  authDomain: "mylove-taskmanager.firebaseapp.com",
  projectId: "mylove-taskmanager",
  storageBucket: "mylove-taskmanager.firebasestorage.app",
  messagingSenderId: "396463835279",
  appId: "1:396463835279:web:25c86ce5be493b16ef88fa",
  measurementId: "G-RQY2PDGD0E",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let tasks = [];
let editingTaskId = null;
let unsubscribe = null;

function showLoading() {
  document.getElementById("loadingOverlay").classList.add("active");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("active");
}

window.showScreen = function (screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
};

window.showQuestion = function () {
  showScreen("question");
};

// ✅ Update: Selalu tampilkan addTaskHas
window.showAddTask = function () {
  // Reset form jika bukan edit mode
  if (!editingTaskId) {
    document.getElementById("taskForm2").reset();
  }
  showScreen("addTaskHas");
};

window.showTaskList = function () {
  showScreen("taskList");
  renderTasks();
};

async function startApp() {
  showLoading();

  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderTasks();
      hideLoading();
    },
    (error) => {
      console.error("Error loading tasks:", error);
      hideLoading();
      alert("Gagal memuat data tugas. Coba refresh halaman ya sayang!");
    }
  );

  setTimeout(() => {
    showScreen("question");
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== Dropdown Mata Pelajaran =====
  const subjectFake = document.getElementById("subjectFake");
  const subjectSelect = document.getElementById("subject");
  const dropdownPopup = document.getElementById("dropdownPopup");
  const overlay = document.getElementById("overlay");
  const mainContent = document.getElementById("mainContent");

  if (subjectFake) {
    subjectFake.addEventListener("click", () => {
      dropdownPopup.style.display = "block";
      overlay.style.display = "block";
      mainContent.classList.add("blur-bg");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      dropdownPopup.style.display = "none";
      overlay.style.display = "none";
      mainContent.classList.remove("blur-bg");
    });
  }

  document.querySelectorAll("#dropdownOptions li").forEach((item) => {
    item.addEventListener("click", () => {
      subjectFake.value = item.dataset.value;
      subjectSelect.value = item.dataset.value;
      dropdownPopup.style.display = "none";
      overlay.style.display = "none";
      mainContent.classList.remove("blur-bg");
    });
  });

  const fakeDateInput = document.getElementById("fakeDateInput");
  const deadline2 = document.getElementById("deadline2");
  const hiddenDeadline = document.getElementById("deadline");
  const calendarPopup = document.getElementById("calendarPopup");
  const calendarGrid = document.getElementById("calendarGrid");
  const monthYear = document.getElementById("monthYear");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const overlayDate = document.getElementById("overlayDate");

  let currentDate = new Date();

  function renderCalendar(date) {
    calendarGrid.innerHTML = "";

    const year = date.getFullYear();
    const month = date.getMonth();

    monthYear.textContent = `${date.toLocaleString("id-ID", {
      month: "long",
    })} ${year}`;

    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    days.forEach((d) => {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";
      dayEl.textContent = d;
      calendarGrid.appendChild(dayEl);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const emptyEl = document.createElement("div");
      calendarGrid.appendChild(emptyEl);
    }

    for (let i = 1; i <= lastDate; i++) {
      const dateEl = document.createElement("div");
      dateEl.className = "calendar-date";
      dateEl.textContent = i;

      dateEl.addEventListener("click", (e) => {
        e.stopPropagation();

        const selected = new Date(year, month, i);

        // Update fakeDateInput untuk display
        fakeDateInput.value = selected.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        // Update deadline2 dan hidden deadline
        const isoDate = selected.toISOString().split("T")[0];
        deadline2.value = isoDate;
        hiddenDeadline.value = isoDate;

        calendarPopup.style.display = "none";
        overlayDate.style.display = "none";
        mainContent.classList.remove("blur-bg");
      });

      calendarGrid.appendChild(dateEl);
    }
  }

  if (prevMonth) {
    prevMonth.addEventListener("click", (e) => {
      e.stopPropagation();
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
  }

  if (nextMonth) {
    nextMonth.addEventListener("click", (e) => {
      e.stopPropagation();
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });
  }

  if (fakeDateInput) {
    fakeDateInput.addEventListener("click", (e) => {
      e.stopPropagation();
      renderCalendar(currentDate);
      calendarPopup.style.display = "block";
      overlayDate.style.display = "block";
      mainContent.classList.add("blur-bg");
    });
  }

  if (overlayDate) {
    overlayDate.addEventListener("click", () => {
      calendarPopup.style.display = "none";
      overlayDate.style.display = "none";
      mainContent.classList.remove("blur-bg");
    });
  }

  if (calendarPopup) {
    calendarPopup.addEventListener("click", (e) => e.stopPropagation());
  }
});

async function handleFormSubmit() {
  const form = document.getElementById("taskForm2");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn2");

    const taskName = document.getElementById("taskName2").value.trim();
    const taskDetail = document.getElementById("taskDetail2").value.trim();
    const taskSubject = document.getElementById("subjectFake").value.trim();
    const taskDeadline = document.getElementById("deadline").value || "";
    const taskType = document.querySelector(
      'input[name="taskType2"]:checked'
    )?.value;

    if (
      !taskName ||
      !taskDetail ||
      !taskSubject ||
      !taskDeadline ||
      !taskType
    ) {
      Swal.fire({
        icon: "warning",
        title: "Upss...",
        text: "Sayang, semua field harus diisi dulu yaaa",
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Disimpan dulu yaa sayaangg";

    try {
      const task = {
        name: taskName,
        detail: taskDetail,
        subject: taskSubject,
        deadline: taskDeadline,
        type: taskType,
        createdAt: serverTimestamp(),
      };

      if (editingTaskId) {
        await updateDoc(doc(db, "tasks", editingTaskId), task);
        editingTaskId = null;
      } else {
        await addDoc(collection(db, "tasks"), task);
      }

      form.reset();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Tugas berhasil disimpan sayaang",
        timer: 1500,
        showConfirmButton: false,
      });

      showTaskList();
    } catch (error) {
      console.error("Error saving task:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Gagal menyimpan tugas. Cobaa lagii yaa sayang",
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Bikin Catatan";
    }
  });
}

handleFormSubmit();

function formatDateDisplay(isoDate) {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
  const day = date.getDate();
  const monthName = date.toLocaleDateString("id-ID", { month: "long" });
  const year = date.getFullYear();

  return `${dayName}, ${day} ${monthName} ${year}`;
}

function renderTasks() {
  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Belum adaa tugass nii sayaang</h3>
        <p>Yeeayy! Kamuu bebass duluu sayaaang</p>  
      </div>
    `;
    return;
  }

  tasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";
    taskCard.innerHTML = `
      <div class="task-matpel task-info">${task.subject}</div>
      <div class="task-deadline task-info">${formatDateDisplay(
        task.deadline
      )}</div>

      <div class="task-name task-info">${task.name}</div>
      <div class="task-type task-info">${task.type}</div>
      <div class="task-detail task-info">${task.detail}</div>
      <div class="task-actions">
        <button class="action-btn btn-complete" onclick="completeTask('${
          task.id
        }')">
          <i class="fa-solid fa-check"></i>
        </button>
        <button class="action-btn btn-edit" onclick="editTask('${task.id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="action-btn btn-delete" onclick="deleteTask('${
          task.id
        }')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    container.appendChild(taskCard);
  });
}

window.completeTask = async function (id) {
  const result = await Swal.fire({
    title: "Udah Selesai Sayangg??",
    text: "Kamu cek lagi ya untuk memastikan selesai ❤️",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sudah Sayang",
    cancelButtonText: "Belum Sayang",
  });

  if (!result.isConfirmed) return;

  showLoading();
  try {
    await deleteDoc(doc(db, "tasks", id));
    Swal.fire(
      "YEAAY KEREEN!",
      "Tugas Sudaa selesaai, Kamu hebatt 💖",
      "success"
    );
  } catch (error) {
    console.error("Error completing task:", error);
    Swal.fire("Gagal!", "Gagal menyelesaikan tugas. Coba lagi 😢", "error");
  } finally {
    hideLoading();
  }
};

window.deleteTask = async function (id) {
  const result = await Swal.fire({
    title: "Hapus tugas?",
    text: "Yakin mau hapus tugas ini sayang?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Iyaa Sayaang",
    cancelButtonText: "Gajadii ahh",
  });

  if (!result.isConfirmed) return;

  showLoading();
  try {
    await deleteDoc(doc(db, "tasks", id));
    Swal.fire("Terhapus!", "Tugas berhasil dihapus", "success");
  } catch (error) {
    console.error("Error deleting task:", error);
    Swal.fire("Gagal!", "Gagal menghapus tugas. Coba lagi", "error");
  } finally {
    hideLoading();
  }
};

window.editTask = function (id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;

  document.getElementById("taskName2").value = task.name;
  document.getElementById("taskDetail2").value = task.detail;
  document.getElementById("subjectFake").value = task.subject;
  document.getElementById("subject").value = task.subject;

  document.getElementById("deadline2").value = task.deadline;
  document.getElementById("deadline").value = task.deadline;

  const date = new Date(task.deadline);
  document.getElementById("fakeDateInput").value = formatDateDisplay(
    task.deadline
  );

  document.querySelector(
    `input[name="taskType2"][value="${task.type}"]`
  ).checked = true;

  showScreen("addTaskHas");
};

startApp();
