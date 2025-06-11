const gallery = document.querySelector(".gallery");
const filters = document.querySelector(".filters");

let categories = [];
let allWorks = [];

/**** Récupération des travaux depuis l'API ****/
async function fetchWorks() {
  try {
    const response = await fetch("http://localhost:5678/api/works");

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    const data = await response.json();
    allWorks = data;
    console.log(allWorks);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets :", error);
  }
  worksDisplay(allWorks);
  getCategories();
  filtersDisplay();

  /**** Gestion des filtres ****/
  const filtersButton = document.querySelectorAll(".filters button");

  filtersButton.forEach((button) => {
    button.addEventListener("click", () => {
      filtersButton.forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");

      let category = button.textContent;
      if (category === "Tous") {
        worksDisplay(allWorks);
      } else {
        const filteredWorks = allWorks.filter(
          (work) => work.category.name === category
        );
        worksDisplay(filteredWorks);
      }
    });
  });
}

/*** Affichage des travaux dans l'accueil ***/
function worksDisplay(worksToDisplay) {
  gallery.innerHTML = worksToDisplay
    .map(
      (works) =>
        `
    <figure>
        <img src="${works.imageUrl}" alt="${works.title}">
        <figcaption>${works.title}</figcaption>
      </figure>
    `
    )
    .join("");
}

/***** Récupération des catégories depuis l'API *****/
async function fetchCategories() {
  try {
    const response = await fetch("http://localhost:5678/api/categories");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories :", error);
    return [];
  }
}

/*** Extraction des catégories uniques ***/
function getCategories() {
  allWorks.forEach((work) => {
    const exists = categories.find((cat) => cat.id === work.category.id);
    if (!exists) {
      categories.push({
        id: work.category.id,
        name: work.category.name,
      });
    }
  });

  console.log(categories);
}

/*** Affichage des boutons de filtres ***/
function filtersDisplay() {
  filters.innerHTML = `<button class="active">Tous</button>`;

  categories.forEach((cat) => {
    filters.innerHTML += `<button data-id="${cat.id}">${cat.name}</button>`;
  });
}

/*** Activation du mode édition si connecté ***/
const token = localStorage.getItem("token");
if (token) {
  activateEditMode();
  fetchWorks();
}

/** Remplacer login par logout + barre d'édition ***/
function activateEditMode() {
  const editBar = document.createElement("div");
  editBar.classList.add("edit-bar");
  editBar.innerHTML = `<p><i class="fa-regular fa-pen-to-square"></i> Mode édition</p>`;
  document.body.prepend(editBar);

  const navItems = document.querySelectorAll("nav ul li");
  navItems.forEach((li) => {
    if (li.textContent.trim().toLowerCase() === "login") {
      li.textContent = "logout";
      li.addEventListener("click", () => {
        localStorage.removeItem("token");
        li.textContent = "login"; // Remettre login
        location.href = "index.html"; // Revenir à la page d'accueil
      });
    }
  });

  /***  Afficher le lien "modifier" à côté du titre ***/
  const edit = document.querySelector("#portfolio .edit-portfolio");
  if (edit) {
    edit.style.display = "inline-flex";
    edit.innerHTML = `<i class="fa-regular fa-pen-to-square"></i> modifier`;
  }

  /*** Retirer les filtres ***/
  const filtersRemove = document.querySelector(".filters");
  if (filtersRemove) {
    filtersRemove.remove();
  }
}

/*** Sélections modale ***/
const modal = document.querySelector(".modal");
const openModalBtn = document.querySelector(".edit-portfolio");
const closeModalBtn = document.querySelector(".modal-close");
const backBtn = document.querySelector(".modal-back");
const galleryView = document.querySelector(".modal-gallery-view");
const addView = document.querySelector(".modal-add-view");
const openAddViewBtn = document.querySelector(".open-add-view");
const modalGallery = document.querySelector(".modal-gallery");

/**** Ouvrir la modale galerie ***/
openModalBtn.addEventListener("click", (e) => {
  e.preventDefault();
  modal.classList.remove("hidden");
  galleryView.classList.remove("hidden");
  addView.classList.add("hidden");

  displayWorksInModal();
});

/*** Fermer la modale avec la croix ***/
closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");

  resetModalForm();
});

/*** Fermer la modale en cliquant dehors ***/
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    resetModalForm();
  }
});

/*** Passer à la vue "Ajout photo" ***/
openAddViewBtn.addEventListener("click", () => {
  galleryView.classList.add("hidden");
  addView.classList.remove("hidden");

  fetchCategories().then((cats) => {
    remplirSelectCategories(cats);
  });
});

/*** Revenir à la vue "Galerie photo" avec la flèche ***/
backBtn.addEventListener("click", () => {
  addView.classList.add("hidden");
  galleryView.classList.remove("hidden");
  resetModalForm();
});

/*** Supprimer les données de la modale ***/
function resetModalForm() {
  form.reset();

  /** Réinitialiser zone d’upload **/
  const uploadZone = document.querySelector(".upload-zone");
  uploadZone.innerHTML = `
    <label for="image-upload" class="upload-label">
      <i class="fa-regular fa-image"></i>
      <span>+ Ajouter photo</span>
    </label>
    <input
      id="image-upload"
      type="file"
      accept="image/png, image/jpeg"
      hidden
    />
    <p class="upload-info">jpg, png : 4mo max</p>
  `;

  /** Réinitialiser les messages d'erreur **/
  titleMsg.textContent = "";
  categoryMsg.textContent = "";
  const imageError = document.getElementById("image-error");
  if (imageError) imageError.textContent = "";

  imageSelected = false;
  submitBtn.classList.remove("active");

  const newInput = document.getElementById("image-upload");
  newInput.addEventListener("change", handleImageChange);
}

/*** Affichage des travaux dans la modale galerie ***/
function displayWorksInModal() {
  modalGallery.innerHTML = allWorks
    .map(
      (works) =>
        `
      <figure data-id="${works.id}">
        <div class="image-wrapper">
          <img src="${works.imageUrl}" alt="${works.title}">
          <i class="fa-solid fa-trash-can delete-icon"></i>
        </div>
      </figure>
    `
    )
    .join("");

  /***** Delete d'un travail dans la modale *****/
  modalGallery.querySelectorAll(".delete-icon").forEach((icon) => {
    icon.addEventListener("click", async (event) => {
      const figure = event.target.closest("figure");
      const workId = figure.dataset.id;
      const token = localStorage.getItem("token");
      const errorMsg = document.getElementById("modal-error");

      try {
        const response = await fetch(
          `http://localhost:5678/api/works/${workId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          figure.remove();
          allWorks = allWorks.filter((work) => work.id !== parseInt(workId));
          worksDisplay(allWorks);
        } else {
          errorMsg.textContent = "Échec de la suppression du projet";
        }
      } catch (error) {
        console.error("Erreur :", error);
      }
    });
  });
}

/***** Création de l'image preview *****/
const imagePreview = document.createElement("img");
imagePreview.classList.add("preview");

/***** Remplissage du select de catégories *****/
function remplirSelectCategories(categories) {
  const select = document.getElementById("category");

  select.innerHTML = `<option value="" disabled selected hidden></option>`;

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

/***** Validation des champs ajout photo *****/

const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const titleMsg = document.getElementById("title-error");
const categoryMsg = document.getElementById("category-error");
const submitBtn = document.getElementById("submit-photo");

function validerTitle() {
  return titleInput.value.trim().length >= 2;
}

function validerCategorie() {
  return categoryInput.value !== "";
}

const form = document.querySelector(".modal-form");

/***** Affichage erreurs au blur *****/
titleInput.addEventListener("blur", () => {
  if (!validerTitle()) {
    titleMsg.textContent = "Le titre doit contenir au moins 2 caractères.";
  }
});

categoryInput.addEventListener("blur", () => {
  if (!validerCategorie()) {
    categoryMsg.textContent = "Veuillez sélectionner une catégorie.";
  }
});

/***** Masquer les erreurs si utilisateur corrige *****/
titleInput.addEventListener("input", () => {
  if (validerTitle()) {
    titleMsg.textContent = "";
  }
});

categoryInput.addEventListener("change", () => {
  if (validerCategorie()) {
    categoryMsg.textContent = "";
  }
});

/***** Soumission du formulaire ajout photo *****/
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = form.querySelector("#image-upload");
  const file = fileInput?.files[0];
  const imageError = document.getElementById("image-error");

  let valid = true;

  if (!validerTitle()) {
    titleMsg.textContent = "Le titre doit contenir au moins 2 caractères.";
    valid = false;
  } else {
    titleMsg.textContent = "";
  }

  if (!validerCategorie()) {
    categoryMsg.textContent = "Veuillez sélectionner une catégorie.";
    valid = false;
  } else {
    categoryMsg.textContent = "";
  }

  if (!file || !file.type.startsWith("image/")) {
    imageError.textContent = "Veuillez ajouter une image.";
    valid = false;
  } else {
    imageError.textContent = "";
  }

  if (!valid) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", titleInput.value.trim());
  formData.append("category", categoryInput.value);

  const token = localStorage.getItem("token");

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      const newWork = await response.json();
      allWorks.push(newWork);
      worksDisplay(allWorks);
      displayWorksInModal();
      resetModalForm();
      displayWorksInModal();
      addView.classList.remove("hidden");
      galleryView.classList.add("hidden");
      modal.classList.add("hidden");
    } else {
      console.error("Erreur lors de l'envoi du projet :", response.statusText);
    }
  } catch (error) {
    console.error("Erreur :", error);
  }
});

/***** Gestion du changement d'image *****/
function handleImageChange(e) {
  const file = e.target.files[0];
  const imageError = document.getElementById("image-error");

  if (
    file &&
    file.type.startsWith("image/") &&
    (file.type === "image/jpeg" || file.type === "image/png") &&
    file.size <= 4 * 1024 * 1024
  ) {
    const reader = new FileReader();
    reader.onload = function (event) {
      let previewImg = document.querySelector(".preview");

      if (!previewImg) {
        previewImg = document.createElement("img");
        previewImg.classList.add("preview");
        previewImg.style.Width = "100%";
        previewImg.style.Height = "100%";
        previewImg.style.objectFit = "contain";
        previewImg.style.display = "block";
        previewImg.style.margin = "10px auto";

        const uploadZone = document.querySelector(".upload-zone");
        uploadZone.prepend(previewImg);
      }

      previewImg.src = event.target.result;
      previewImg.classList.remove("hidden");

      const label = document.querySelector(".upload-label");
      if (label) label.style.display = "none";

      const infoText = document.querySelector(".upload-info");
      if (infoText) infoText.style.display = "none";

      imageError.textContent = "";
      imageSelected = true;
      activerSubmitSiValide();

      // Permet de supprimer l'image si on clique sur la zone
      const uploadZone = document.querySelector(".upload-zone");
      uploadZone.onclick = function () {
        const previewImg = document.querySelector(".preview");
        if (previewImg && !previewImg.classList.contains("hidden")) {
          previewImg.remove(); // supprime la preview
          imageSelected = false;
          document.querySelector(".upload-label").style.display = "flex";
          document.querySelector(".upload-info").style.display = "block";
          document.getElementById("image-upload").value = ""; // reset l'input
          activerSubmitSiValide();
        }
      };
    };
    reader.readAsDataURL(file);
  } else {
    imageSelected = false;

    if (!file) {
      imageError.textContent = "Veuillez ajouter une image.";
    } else if (file.type !== "image/jpeg" && file.type !== "image/png") {
      imageError.textContent = "Format invalide (jpg ou png uniquement).";
    } else if (file.size > 4 * 1024 * 1024) {
      imageError.textContent = "Image trop lourde (max 4 Mo).";
    }

    activerSubmitSiValide();
  }
}

/*** Boutton valider actif ***/
let imageSelected = false;

titleInput.addEventListener("input", activerSubmitSiValide);

categoryInput.addEventListener("change", activerSubmitSiValide);

document.addEventListener("change", (e) => {
  if (e.target.id === "image-upload") {
    imageSelected = !!e.target.files[0];
    activerSubmitSiValide();
  }
});

function activerSubmitSiValide() {
  const titreOK = titleInput.value.trim().length >= 2;
  const categorieOK = categoryInput.value !== "";
  const toutValide = titreOK && categorieOK && imageSelected;

  submitBtn.disabled = !toutValide;

  if (toutValide) {
    submitBtn.classList.add("active");
  } else {
    submitBtn.classList.remove("active");
  }
}

/***** Lancer gestion image au chargement *****/
document
  .getElementById("image-upload")
  .addEventListener("change", handleImageChange);

// Forcer le scroll sur #contact si l'URL contient #contact
window.addEventListener("load", () => {
  if (window.location.hash === "#contact") {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  }
});

fetchWorks();
