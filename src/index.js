const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];


//Middlewares 
function checksExistsUserAccount(request, response, next) {
   const{ username } = request.headers;

   const userFound = users.find((user)=>
   username === user.username  
   );
   if(!userFound){
     return response.status(404).json({
       error: 'User not found'
     });
   }
   request.user = userFound;
   return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
   const { user } = request;

   const { pro, todos } = user;

   console.log(pro, todos);

   if (!pro && todos.length > 9) {
    return response.status(403).json({ error: "User reached maximum number of Todos. Time to go Pro!" });
   }

   return next();
}
function checksTodoExists(request, response, next) {
   const { username } = request.headers;
   const { id } = request.params;

  if (!validate(id)) {
    return response.status(400).json({ error: "Id is not a valid UUID!" });
  }
   const userFound = users.find((user)=>
   username === user.username);
   
   if (!userFound) {
    return response.status(404).json({ error: "User does not exist!" });
  }
   const todoFound = userFound.todos.find((todo)=>
     todo.id === id
   );
   if (!todoFound) {
    return response.status(404).json({ error: "Todo does not exist!" });
  }
    request.user = userFound;
    request.todo = todoFound;
    return next();
}
function findUserById(request, response, next) {
   const { id } = request.params;

   const userFound = users.find((user)=>
     user.id === id
     );
   if(!userFound){
     return response.status(404).json({
       error: 'User not found'
     });
   
   }
   request.user = userFound;
   return next();
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

// Patch user plan to pro Route
app.patch('/users/:id/pro', findUserById, (request, response)=>{
   const { user } = request;
   if(user.pro){
     return response.status(400).json({
        error: 'Pro plan is already activated.'
     });
   }
   user.pro = true;

   return response.json(user);
});

// Get all todos Route
app.get('/todos', checksExistsUserAccount, (request, response) => {
   const { user } = request;
   return response.json(user.todos);
});

// Post todo Route
app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
   const { title, deadline } = request.body; 
   const { user } = request;
   

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

   return response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};