<template>
  <div id="app">
    <Header />
    <div class="app-content mt-4">
      <div class="container mt-4 mb-4">
        <div class="map row" id="map" ref="map">
          <div class="map-image col-md-12">
            <WorldMap @countryEnter="hoverCountry" @countryLeave="deactivateArea" ref="worldMap" />
            <div class="legend">
              <div class="legend-present">Compte présent</div>
              <div class="legend-active">Compte selectioné</div>
            </div>
          </div>

          <div class="map-list col-md-12">
            <div class="card">
              <transition name="fade">
                <Loader v-if="loading" class="full-loader" />
              </transition>
              <div class="card-body">
                <div class="text-right">
                  <span class="mr-2 font-weight-bold">Devise:</span>
                  <select name id="selectCurrency" v-model="currentCurrency">
                    <option
                      v-for="currency in currencies"
                      :key="currency"
                      :value="currency"
                    >{{ currency }}</option>
                  </select>
                </div>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Titulaire</th>
                        <th scope="col">Bic</th>
                        <th scope="col">Banque</th>
                        <th scope="col">Montant dévise d'origine</th>
                        <th scope="col">Montant en {{ this.currentCurrency }}</th>
                      </tr>
                    </thead>
                    <tbody class="list">
                      <tr
                        v-for="compte in comptes"
                        :key="compte.code"
                        :data-country="compte.CountryCode3"
                        ref="lists"
                        @mouseenter="activeArea"
                        @mouseleave="deactivateArea"
                      >
                        <th>{{compte.Code}}</th>
                        <td>{{compte.Owner}}</td>
                        <td>{{compte.Bank}}</td>
                        <td>{{compte.Bank}}</td>
                        <td
                          :class="compte.FormatedAmout > 0 ? 'positive': 'negative'"
                        >{{ formatCurrency(compte.FormatedAmout, compte.Currency) }}</td>
                        <td
                          :class="compte.FormatedAmout > 0 ? 'positive': 'negative'"
                        >{{ formatCurrency(compte.FormatedAmout) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="text-right">Sold consolidé: {{ formatCurrency(totalAmout) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WorldMap from "@/components/WorldMap";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
// TODO: ajouter plus de data avec les autres currency pour tester
// TODO: mettre la devise par defaut a la premer valeur
// TODO: Convertir la monnai dans la currency
// TODO: Afficher le montant de la conversion et la date
// TODO: Ajouter un champ dans la modification de la monnaie ????
export default {
  name: "app",
  components: {
    WorldMap,
    Header,
    Loader
  },
  filters: {
    currency(value) {
      let formatedValue;
      switch (this.currentCurrency) {
        case "EUR":
          Intl.NumberFormat("U");
          formatedValue = `${value} €`;
          break;
        case "USD":
          formatedValue = `${value} €`;
          break;
        default:
          formatedValue = value;
          break;
      }
      return formatedValue;
    }
  },
  data() {
    return {
      comptes: null,
      totalAmout: 0,
      eurUsdRate: 1,
      error: null,
      loading: false,
      currentCurrency: "EUR",
      currencies: new Set()
    };
  },
  async created() {
    this.loading = true;
    // setTimeout(async () => {
    const { counterpart } = await (await fetch("data/data.json")).json();
    this.comptes = counterpart;
    console.log(this.comptes);

    this.comptes.forEach(compte => {
      // TODO: faire un if et convert les USD to EUR
      compte.FormatedAmout = parseFloat(compte.Amout.replace(/\s/g, ""));
      this.currencies.add(compte.Currency);
      this.$refs.map
        .querySelector("#" + compte.CountryCode3)
        .classList.add("present");
    });

    this.loading = false;
    // TODO: la conversion
    // let rep = await this.convertAmount("USD", "EUR", 1000);
    // console.log(rep);

    // console.log(this.comptes);
    // }, 1000);
  },
  destroyed() {},
  methods: {
    hoverCountry(event) {
      if (this.$refs.lists) {
        this.$refs.lists.forEach(account => {
          if (event.id === account.dataset.country) {
            account.classList.add("is-active");
          }
        });
      }
    },
    activeArea(event) {
      event.target.classList.add("is-active");
      let countryId = event.target.dataset.country;
      this.$refs.map.querySelector("#" + countryId).classList.add("is-active");
    },
    deactivateArea() {
      this.$refs.map.querySelectorAll(".is-active").forEach(element => {
        element.classList.remove("is-active");
        // console.log(element);
      });
    },
    computeTotalAmout() {
      this.totalAmout = this.comptes.reduce((acc, compte) => {
        console.log(compte.FormatedAmout);

        return acc + compte.FormatedAmout;
      }, 0);
      console.log(this.totalAmout);
    },
    async convertAmount(from, to, value) {
      return new Promise((resolve, reject) => {
        fetch(`http://api.ibanfirst.com/PublicAPI/Rate/${to}${from}/`)
          .then(response => response.json())
          .then(json => {
            let newAmount = parseFloat(value / json.rate.rate);
            resolve(newAmount);
          })
          .catch(e => {
            reject(e);
          });
      });
    },
    formatCurrency(value, currency = this.currentCurrency) {
      let formatedValue;
      switch (currency) {
        case "EUR":
          formatedValue = new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR"
          }).format(value);
          break;
        case "USD":
          formatedValue = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
          }).format(value);
          break;
        default:
          formatedValue = value;
          break;
      }
      return formatedValue;
    }
  }
};
</script>

<style lang="scss">
$active: #596391;
$present: #a8a6fa;
body {
  background-color: rgba(242, 243, 252, 1);
  color: #1a204b;
}

.map-list {
  transition: 0.3s;
  .is-active {
    background-color: $active;
    color: white;
  }
}

.card {
  border-radius: 0.7rem;
}

.map-image {
  .present {
    fill: $present;
  }
  .is-active {
    fill: $active;
  }
}

.full-loader {
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.table {
  th {
    padding: 1rem;
  }
  thead {
    th {
      border: 0;
      font-size: 0.8rem;
      color: #c2c4d8;
      padding-bottom: 0.6rem;
    }
  }
}

.positive {
  font-weight: bold;
  color: #44c78f;
}

.negative {
  font-weight: bold;
  color: #f03434;
}

.legend {
  position: absolute;
  bottom: 7px;
  left: 18px;
  font-size: 0.6rem;
  div {
    &:before {
      content: "";
      width: 0.6rem;
      height: 0.6rem;
      display: inline-block;
      margin-right: 0.3rem;
    }
  }
  .legend-present {
    &:before {
      background-color: $present;
    }
  }
  .legend-active {
    &:before {
      background-color: $active;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>
