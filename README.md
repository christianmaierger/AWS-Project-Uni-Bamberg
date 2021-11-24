## Weird Table definition interaction
When defining a table as a resource in the `serverless.yml` file, there a two names to be given:
- The yaml - keyname directly in the Resources list
- The Tablename defined by `TableName` inside the resource definition

Those two names do not need to be the same, the first one however servers as a unique identifier for the table, which is not visible in the dynamoDB webinterface.

 With the second one, you define the displayed name of the table in the webinterface.

 This can lead to some weird interactions, like only renaming your table if you only change the second name, or not being able to create another table with the same first name.

 EDIT: Even when changing both names, the database renamed/overwritten (?)
 -> Maybe its bound to the specific project?