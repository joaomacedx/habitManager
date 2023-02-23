const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];


//Middlewares 
function checksExistsUserAccount(request, response, next) {
   const{ username } = request.headers;

   const user = users.find((user)=>
     user.username === username
   );
   if(!user){
     return response.status(404).json({
       error: 'User not found'
     });
   }
   request.user = user;
   return next();
}

function checksCreateTodosUserAvailability(request, response, next) {

}
function checksTodoExists(request, response, next) {
   const { user } = request;
   const { id } = request.params;
   const todo = user.todos.find((todo)=>
     todo.id === id
   );
   if(!todo){
     return response.status(404).json({
       error: 'Todo not found' 
     });
   }
   request.user.todo = todo;
   return next();
}
function findUserById(request, response, next) {
   const { id } = request.params;
   const user = users.find((user)=>
     user.id === id
     );
   if(!user){
     return response.status(404).json({
       error: 'User not found'
     });
   
   }
   request.user = user;
}
// Routes 

// Add User route 
app.post('/users', (request, response) => {
   const { name, username } = request.body;

   const userExists = users.find((user)=> 
     user.username === username
   );
   if(userExists){
     return response.status(400).json({
       error: 'Username already exists'
     });
   }

   const user = {
    id: uuidv4(),
    name,
    username,
    pro:false,
    todos:[]
   }
   users.push(user); 
  
   return response.status(201).json(user);
});

// Get users by id Route
app.get('/users/:id', findUserById, (request, response)=> {
   const { user } = request;
   return response.json(user);
});
// Get all todos Route
app.get('/todos', checksExistsUserAccount, (request, response) => {
   const { user } = request;
   return response.json(user.todos);
});

// Post todo Route
app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
   const { user } = request;
   const { title, deadline } = request.body;

   const newTodo= {
     id: uuidv4(),
     title,
     done: false,
     deadline: new Date(deadline),
     created_at: new Date()
   };
   user.todos.push(newTodo);
   return response.status(201).json(newTodo);
});
// Put todo title by id Route
app.put('/todos/:id', checksTodoExists, (request, response) => {
   const { title, deadline } = request.body;
   const { todo } = request;

   todo.title = title;
   todo.deadline = new Date(deadline);
   return response.json(todo);
});
// Patch todo to done by id Route
app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
   const { todo } = request;

   todo.done = true;

   return response.json(todo);
});
// Delete todo by id Route
app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
   const { user, todo } = request;
   const todoIndex = user.todos.indexOf(todo);
   if(todoIndex === -1){
     return response.status(404).json({
       error: 'Todo not found' 
     });
   }
   user.todos.splice(todoIndex, 1);

   response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};