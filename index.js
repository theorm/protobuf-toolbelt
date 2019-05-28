const {
  get, find, isNil, groupBy, mapValues, 
  entries, isObject, isArray, concat, 
  flatten, mapKeys
} = require('lodash')

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
  if (val === null) return null;
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

    const itemValue = itemIsRepeated && item !== null
      ? item.map(subitem => jspbToJson(subitem, schema, get(itemSpec, 'type'), skipNullFields, undefinedFieldPrefix, messageSpec))
      : jspbToJson(item, schema, get(itemSpec, 'type'), skipNullFields, undefinedFieldPrefix, messageSpec)

    const fieldName = get(itemSpec, 'name', `${undefinedFieldPrefix}_${itemPosition}`)

    if (itemValue === null && skipNullFields) return;
    context[fieldName] = itemValue  
  })
  return context
}

function getUndefinedFields(obj, prefix = 'uf_', ctx = []) {
  if (isArray(obj)) {
    return flatten(obj.map((f, idx) => getUndefinedFields(f, prefix, concat(ctx, idx))))
      .filter(o => !isNil(o))
  } else if (isObject(obj)) {
    return flatten(entries(obj).map(([k, v]) => {
      return getUndefinedFields(v, prefix, concat(ctx, k))
    })).filter(o => !isNil(o))
  } else {
    if (ctx.filter(i => String(i).startsWith(prefix)).length > 0) {
      return { path: ctx, value: obj }
    }
  }
}

// https://github.com/protobufjs/protobuf.js/blob/e8449c4bf1269a2cc423708db6f0b47a383d33f0/examples/custom-get-set.js#L14-L17
function toCamelCase(str) {
  return str.substring(0,1) + str.substring(1).replace(/_([a-z])(?=[a-z]|$)/g, function($0, $1) { return $1.toUpperCase(); });
}

function fieldNamesToCamelCase(obj) {
  if (isArray(obj)) {
    return obj.map(fieldNamesToCamelCase)
  } else if (isObject(obj)) {
    return mapValues(mapKeys(obj, (v, k) => toCamelCase(k)), fieldNamesToCamelCase)
  }
  return obj
}


module.exports = {
  jspbToJson,
  getUndefinedFields,
  fieldNamesToCamelCase
}
