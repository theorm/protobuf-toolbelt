const { get, find, isNil, groupBy, mapValues, entries } = require('lodash')

function getMessageSpecByName(schema, fieldSpec, name = undefined) {
  if (name === undefined) return undefined
  const fieldMessageSpec = find(get(fieldSpec, 'messages', []), msg => get(msg, 'name') === name)
  if (fieldMessageSpec !== undefined) return fieldMessageSpec 
  return find(get(schema, 'messages', []), msg => get(msg, 'name') === name)
}

function getEnumByName(schema, field, name = undefined) {
  if (name === undefined) return undefined
  const fieldEnumSpec = find(get(field, 'enums', []), e => get(e, 'name') === name)
  if (fieldEnumSpec !== undefined) return fieldEnumSpec 
  return find(get(schema, 'enums', []), e => get(e, 'name') === name)
}

function getEnumValue(enumSpec, val) {
  const defaultValue = `OPTION_${val}`
  if (isNil(enumSpec)) return defaultValue
  const indexToField = mapValues(groupBy(entries(get(enumSpec, 'values', [])), '1.value'), '0.0')
  return get(indexToField, val, defaultValue)
}

/**
 * 
 * @param {Array} jspb protobuf as compact json
 * @param {Object} schema a `protocol-buffers-schema` object. Optional
 * @param {*} topLevelMessageName top level message. Must be in `schema`. Optional.
 * @param {*} context context to fill.
 */
function jspbToJson(jspb, schema = undefined, topLevelMessageName = undefined, skipNullFields = false, undefinedFieldPrefix = 'uf', topLevelMessageSpec = undefined, context = {}) {
  if (!Array.isArray(jspb)) {
    // TODO: extract to a separate function that converts types.
    if (topLevelMessageName === 'bool' && jspb !== null) return Boolean(jspb)
    const enumSpec = getEnumByName(schema, topLevelMessageSpec, topLevelMessageName)
    if (enumSpec) {
      return getEnumValue(enumSpec, jspb)
    }
    return jspb
  }

  const messageSpec = getMessageSpecByName(schema, topLevelMessageSpec, topLevelMessageName)
  jspb.forEach((item, idx) => {
    const itemPosition = idx + 1
    const itemSpec = find(get(messageSpec, 'fields', []), field => get(field, 'tag') === itemPosition)
    const itemIsRepeated = get(itemSpec, 'repeated', false)

    const itemValue = itemIsRepeated
      ? item.map(subitem => jspbToJson(subitem, schema, get(itemSpec, 'type'), skipNullFields, undefinedFieldPrefix, messageSpec))
      : jspbToJson(item, schema, get(itemSpec, 'type'), skipNullFields, undefinedFieldPrefix, messageSpec)

    const fieldName = get(itemSpec, 'name', `${undefinedFieldPrefix}_${itemPosition}`)

    if (itemValue === null && skipNullFields) return;
    context[fieldName] = itemValue  
  })
  return context
}


module.exports = {
  jspbToJson
}
