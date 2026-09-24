const menuButton = document.querySelector("[data-menu-trigger]");
const mobileMenu = document.querySelector("#mobile-menu");

menuButton?.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute("aria-label", expanded ? "打开菜单" : "关闭菜单");
  mobileMenu.classList.toggle("is-open", !expanded);
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "打开菜单");
    mobileMenu.classList.remove("is-open");
  });
});

const searchDialog = document.querySelector("[data-search-dialog]");
const searchField = document.querySelector("#site-search");
const searchResults = document.querySelector("[data-search-results]");
const searchableStories = [...document.querySelectorAll("[data-search-title]")].map((article) => ({
  id: article.id,
  title: article.dataset.searchTitle,
}));

function renderSearchResults(value = "") {
  const query = value.trim().toLocaleLowerCase("zh-CN");
  const matches = searchableStories.filter((story) => story.title.toLocaleLowerCase("zh-CN").includes(query));
  searchResults.replaceChildren();

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "没有找到相关记录。";
    searchResults.append(empty);
    return;
  }

  matches.forEach((story) => {
    const result = document.createElement("button");
    result.type = "button";
    result.textContent = story.title;
    result.addEventListener("click", () => {
      searchDialog.close();
      document.getElementById(story.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    searchResults.append(result);
  });
}

document.querySelector("[data-search-open]")?.addEventListener("click", () => {
  renderSearchResults(searchField.value);
  searchDialog.showModal();
  searchField.focus();
});

document.querySelector("[data-search-close]")?.addEventListener("click", () => searchDialog.close());
searchField?.addEventListener("input", (event) => renderSearchResults(event.target.value));
searchDialog?.addEventListener("click", (event) => {
  if (event.target === searchDialog) searchDialog.close();
});
