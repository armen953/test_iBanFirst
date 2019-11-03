/**
 * Make async foreach on array
 * @param {*} array
 * @param {*} callback
 */
export let asyncForEach = async function(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
