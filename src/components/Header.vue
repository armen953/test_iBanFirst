<template>
  <header>
    <nav class="navbar navbar-expand-md navbar-light bg-white">
      <a class="navbar-brand" href="#">
        <img src="@/assets/logo.png" alt="iBanFirst logo" />
      </a>
      <button @click="showHeader= !showHeader" class="navbar-toggler" type="button">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" :style="showHeader ? 'display: block;' : ''">
        <ul class="navbar-nav mr-auto mt-2 mt-lg-0">
          <li class="nav-item active">
            <a class="nav-link" href="#">Accueil</a>
          </li>
        </ul>
        <form class="form-inline my-2 my-lg-0">
          <input class="form-control mr-sm-2" type="search" placeholder="Rechercher" />
        </form>
      </div>
    </nav>
  </header>
</template>

<script>
export default {
  name: "Header",
  data() {
    return {
      showHeader: false
    };
  }
};
</script>

<style lang="scss" scoped>
.collapse {
  transition: 0.3s ease;
}

nav {
  box-shadow: 0 2px 10px 0 rgba(89, 99, 145, 0.1);
}
</style>