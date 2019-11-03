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
                <div class="card-header bg-white d-flex justify-content-between">
                  <div class="actions">
                    <RefreshButton @btnClick="loadData" />
                  </div>
                  <div class="text-right">
                    <span class="mr-2 font-weight-bold">Devise:</span>
                    <select
                      name
                      id="selectCurrency"
                      v-model="currentCurrency"
                      @change="onCurrencyChange"
                    >
                      <option
                        v-for="currency in currencies"
                        :key="currency"
                        :value="currency"
                      >{{ currency }}</option>
                    </select>
                  </div>
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
                          v-if="compte.FormatedAmout"
                          :class="compte.FormatedAmout > 0 ? 'positive': 'negative'"
                        >{{ formatCurrency(compte.FormatedAmout, compte.Currency) }}</td>
                        <td
                          v-if="compte.FormatedCurrencyAmout"
                          :class="compte.FormatedCurrencyAmout > 0 ? 'positive': 'negative'"
                        >{{ formatCurrency(compte.FormatedCurrencyAmout) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="text-right">
                  Sold consolidé:
                  <span
                    :class="totalAmout > 0 ? 'positive': ''"
                  >{{ formatCurrency(totalAmout) }}</span>
                </div>
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
import RefreshButton from "@/components/RefreshButton";
import { asyncForEach } from "@/utilities";

export default {
  name: "app",
  components: {
    WorldMap,
    Header,
    Loader,
    RefreshButton
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
    await this.loadData();
    // this.currentCurrency = this.comptes[0].Currency;
  },
  methods: {
    async loadData() {
      this.loading = true;

      const { counterpart } = await (await fetch("data/data.json")).json();
      this.comptes = counterpart;

      await this.formatData();
      this.loading = false;
    },
    async formatData() {
      await asyncForEach(this.comptes, async compte => {
        compte.FormatedAmout = parseFloat(compte.Amout.replace(/\s/g, ""));
        compte.FormatedCurrencyAmout = compte.FormatedAmout;
        if (compte.Currency != this.currentCurrency) {
          compte.FormatedCurrencyAmout = await this.convertAmount(
            compte.Currency,
            this.currentCurrency,
            compte.FormatedAmout
          );
        }
        this.currencies.add(compte.Currency);
        this.$refs.map
          .querySelector("#" + compte.CountryCode3)
          .classList.add("present");
      });
      this.computeTotalAmout();
    },
    async onCurrencyChange() {
      this.loading = true;
      await this.formatData();
      this.loading = false;
    },
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
      });
    },
    computeTotalAmout() {
      this.totalAmout = this.comptes.reduce((acc, compte) => {
        return acc + compte.FormatedCurrencyAmout;
      }, 0);
    },
    async convertAmount(from, to, value) {
      return new Promise((resolve, reject) => {
        fetch(`//api.ibanfirst.com/PublicAPI/Rate/${to}${from}/`)
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
