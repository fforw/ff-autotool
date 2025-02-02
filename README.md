# @fforw/autotool

Command line helpers to create a PostgreSQL database from a bootstrap GraphQL schema. 

## Usage

```shell
ff-autotool create schema.sql
```
Creates an empty bootstrap schema

```shell
ff-autotool db schema.sql
```
Prints a PostgresQL db script for the types expressed in the given schema.sql file

```shell
ff-autotool config schema.sql
```
Creates a Java relation config block from the relations in the given schema.sql file

```shell
ff-autotool domain schema.sql
```
Prints the schema in an intermediary internal format as JSON. 

## Bootstrap Schema

The bootstrap schema is a valid GraphQL schema with special helper types and field arguments that configure the relations 
within the domain. To achieve the necessary expressiveness with just a schema definition, it makes use of field attributes 
in a somewhat unusual way.

Here we see an example of a declared type in the bootstrap schema. For simple fields the declaration is basically identically
to what we will have in the final schema. 

```graphql
type Foo
{
    name: String!
    num: Int
    long(m1024: _) : String
    decimal(s2: _, p10: _) : BigDecimal
    text : Text
}
```
The `long` field shows how to specify a non-default maximum length for a String field. Also note how the `text` field uses
the helper type *Text* to express that it is a text field, i.e. the field is a *String* in the final schema and has a text
type in the database.

Similarly, for `decimal` with use attributes to express that we want a scale of 2 and a precision of 10.

`_` is a type without meaning and just exists as convenient gap filler because the abused arguments formally need to have
a type.

All types will have an `id` field which we just ignore in the bootstrap schema.

### Relations

We also can define relations for our types. 

```graphql
type Foo
{
    name: String!
    bar: Bar
    bazes: [Baz]
}

type Bar { name: String! }
type Baz { name: String! }
```
This *Foo* has two relations. A many-to-one relation to *Bar* and a many-to-many relation with *Baz*, but both 
relations are only accessible from *Foo*. If we want *Bar* and *Baz* to link back to *Foo* we need to use back refernces.

```graphql
type Foo
{
    name: String!
    bar(foos: BackReference): Bar
    bazes(foos: BackReference): [Baz]
}

type Bar { name: String! }
type Baz { name: String! }
```
               
Now both relations have a back reference `foos` which will be added as field to the respective type. Back references
always create a *List* field in ff-autotool. If you want something as exotic as a one-to-one relation that is accessible 
from both sides, you need to change the relation config after the fact.
                                                                       
All relations are of course realized as foreign keys in the data base. *Foo.bar* results in just a simple foreign key 
`bar_id` being created in the database.

For all many-to-many relations like `bazes`, we create a link table with foreign keys to referencing both sides of the 
relation.

### Internal JSON format

The internal JSON format you can dump with the `domain` command represents an Automaton centric view on the domain as 
expressed by our bootstrap schema standard.

It is equivalent to the following type definitions

```graphql

type InternalDomain
{
    types: [TypeInfo]!
    linkTables: [LinkTableInfo]
}

type TypeInfo
{
    "Name of the type"
    name: String!
    fields: [FieldInfo]!
    refs: [ReferenceInfo]!
    backRefs: [BackReferenceInfo]!
}

type FieldInfo
{
    "Name of the field"
    name: String!
    "Scalar type of the field"
    type: String!
    "True if the field cannot be null"
    nonNull: Boolean!
    "Maximum field length for String fields"
    maxLength: Int
    "Precision for BigDecimal fields"
    precision: Int
    "Scale for BigDecimal fields"
    scale: Int
}

type ReferenceInfo
{
    "Base name for the reference"
    name: String!
    "Type of the reference"
    type: String!
    "True if the reference cannot be null"
    nonNull: Boolean!
}

type BackReferenceInfo
{
    "Name of the back reference field"
    name: String!
    "Containing type of the back reference field"
    type: String!
    "Source Type of the back reference"
    sourceType: String!
    "Source field of the back reference"
    sourceField: String!
}

type LinkTableInfo
{
    "Link table name"
    name: String!
    "Name of the left side/declaring side id field"
    left: String!
    "Name of the right side id field"
    right: String!
    "Name of the type on the left side/declaring side"
    leftType: String!
    "Name of the type on the right side"
    rightType: String!
}
```
All type names etc within the JSON data have been converted to lowercase snake_case.
