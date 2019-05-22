const { get, find } = require('lodash')

function getMessageSpecByName(schema, name = undefined) {
  if (name === undefined) return undefined
  return find(get(schema, 'messages', []), msg => get(msg, 'name') === name)
}

/**
 * 
 * @param {Array} jspb protobuf as compact json
 * @param {Object} schema a `protocol-buffers-schema` object. Optional
 * @param {*} topLevelMessageName top level message. Must be in `schema`. Optional.
 * @param {*} context context to fill.
 */
function jspbToJson(jspb, schema = undefined, topLevelMessageName = undefined, undefinedFieldPrefix = 'uf', context = {}) {
  if (!Array.isArray(jspb)) return jspb

  const messageSpec = getMessageSpecByName(schema, topLevelMessageName)
  jspb.forEach((item, idx) => {
    const itemPosition = idx + 1
    const itemSpec = find(get(messageSpec, 'fields', []), field => get(field, 'tag') === itemPosition)
    const itemIsRepeated = get(itemSpec, 'repeated', false)

    const itemValue = itemIsRepeated
      ? item.map(subitem => jspbToJson(subitem, schema, get(itemSpec, 'type')))
      : jspbToJson(item, schema, get(itemSpec, 'type'))

    const fieldName = get(itemSpec, 'name', `${undefinedFieldPrefix}_${itemPosition}`)
    context[fieldName] = itemValue  
  })
  return context
}


module.exports = {
  jspbToJson
}
