const pbschema = require('protocol-buffers-schema')
const fs = require('fs')

const { jspbToJson } = require('..')

const testProtoFileName = `${__dirname}/proto/test.proto`
const testJsbpFileName = `${__dirname}/jspb/messageb.jspb`

describe('jspbToJson', () => {
  it('reconstructs a message with top level spec', () => {
    const schema = pbschema.parse(fs.readFileSync(testProtoFileName))
    const topLevelMessage = 'MessageB'
    const jspb = JSON.parse(fs.readFileSync(testJsbpFileName))
    const expectedResult = {
      id: 5,
      items: [
        {
          id: 1,
          uf_2: {
            uf_1: 2,
            uf_2: null,
            uf_3: 'foo'
          },
          optional_field: 3,
          items: ["a", "b", "cd"],
          uf_5: 42,
          flag_field: true,
          choice: 'CHOICE1',
          other_choice: 'OPTION_2'
        }
      ],
      uf_3: 'baz',
      foo: {
        bar: "bar"
      }
    }

    const result = jspbToJson(jspb, schema, topLevelMessage)
    expect(result).toEqual(expectedResult)
  })

  it('reconstructs a message without spec', () => {
    const jspb = JSON.parse(fs.readFileSync(testJsbpFileName))
    const expectedResult = {
      uf_1: 5,
      uf_2: {
        uf_1: {
          uf_1: 1,
          uf_2: {
            uf_1: 2,
            uf_2: null,
            uf_3: 'foo'
          },
          uf_3: 3,
          uf_4: {
            uf_1: "a",
            uf_2: "b",
            uf_3: "cd"
          },
          uf_5: 42,
          uf_6: 1,
          uf_7: 1,
          uf_8: 2
        }
      },
      uf_3: 'baz',
      uf_4: {
        uf_1: "bar"
      }
    }

    const result = jspbToJson(jspb)
    expect(result).toEqual(expectedResult)
  })

  it('skips null fields', () => {
    const schema = pbschema.parse(fs.readFileSync(testProtoFileName))
    const topLevelMessage = 'MessageB'
    const jspb = JSON.parse(fs.readFileSync(testJsbpFileName))
    const expectedResult = {
      id: 5,
      items: [
        {
          id: 1,
          uf_2: {
            uf_1: 2,
            uf_3: 'foo'
          },
          optional_field: 3,
          items: ["a", "b", "cd"],
          uf_5: 42,
          flag_field: true,
          choice: 'CHOICE1',
          other_choice: 'OPTION_2'
        }
      ],
      uf_3: 'baz',
      foo: {
        bar: "bar"
      }
    }

    const result = jspbToJson(jspb, schema, topLevelMessage, true)
    expect(result).toEqual(expectedResult)
  })
})
