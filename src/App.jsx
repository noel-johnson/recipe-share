import { db, storage, auth, signInWithGoogle, logout } from "./firebase.config";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { v4 } from "uuid";

import { useAuthState } from "react-firebase-hooks/auth";
import Login from "./Login";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [imageUpload, setImageUpload] = useState(null);
  const [user, loading, error] = useAuthState(auth);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    ingredients: [],
    steps: [],
  });
  const [popupActive, setPopupActive] = useState(false);

  const recipesCollectionRef = collection(db, "recipes");

  useEffect(() => {
    if (loading) return;
    if (user) {
      onSnapshot(recipesCollectionRef, (snapshot) => {
        setRecipes(
          snapshot.docs.map((doc) => {
            return {
              id: doc.id,
              viewing: false,
              ...doc.data(),
            };
          })
        );
      });
    }
  }, [user, loading]);

  const handleView = (id) => {
    const recipesClone = [...recipes];

    recipesClone.forEach((recipe) => {
      if (recipe.id === id) {
        recipe.viewing = !recipe.viewing;
      } else {
        recipe.viewing = false;
      }
    });

    setRecipes(recipesClone);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !imageUpload ||
      !form.title ||
      !form.desc ||
      !form.ingredients ||
      !form.steps
    ) {
      alert("Please fill out all fields");
      return;
    }

    const imageRef = storageRef(
      storage,
      `images/${
        imageUpload.name.split(".")[0] +
        v4() +
        "." +
        imageUpload.name.split(".")[1]
      }`
    );
    let imageURL = "";
    uploadBytes(imageRef, imageUpload)
      .then((snapshot) => {
        return getDownloadURL(snapshot.ref);
      })
      .then((downloadURL) => {
        imageURL = downloadURL;
        addDoc(recipesCollectionRef, {
          ...form,
          image: imageURL,
          author: user.displayName,
        });
      });

    setForm({
      title: "",
      desc: "",
      ingredients: [],
      steps: [],
    });
    setImageUpload(null);
    setPopupActive(false);
  };

  const handleIngredient = (e, i) => {
    const ingredientsClone = [...form.ingredients];

    ingredientsClone[i] = e.target.value;

    setForm({
      ...form,
      ingredients: ingredientsClone,
    });
  };

  const handleStep = (e, i) => {
    const stepsClone = [...form.steps];

    stepsClone[i] = e.target.value;

    setForm({
      ...form,
      steps: stepsClone,
    });
  };

  const handleIngredientCount = () => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, ""],
    });
  };

  const handleStepCount = () => {
    setForm({
      ...form,
      steps: [...form.steps, ""],
    });
  };

  const removeRecipe = (id) => {
    deleteDoc(doc(db, "recipes", id));
  };

  return (
    <>
      {user ? (
        <div className="App">
          <div className="header">
            <h1>Recipe Share 🍽️</h1>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
          <button onClick={() => setPopupActive(!popupActive)}>
            Add recipe
          </button>
          <div className="recipes">
            {recipes.map((recipe, i) => (
              <div className="recipe" key={recipe.id}>
                <img src={recipe.image} alt="" />
                <h3>{recipe.title}</h3>
                <p>By: {recipe.author}</p>
                <p dangerouslySetInnerHTML={{ __html: recipe.desc }}></p>

                {recipe.viewing && (
                  <div>
                    <h4>Ingredients</h4>
                    <ul>
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i}>{ingredient}</li>
                      ))}
                    </ul>

                    <h4>Steps</h4>
                    <ol>
                      {recipe.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="buttons">
                  <button onClick={() => handleView(recipe.id)}>
                    View {recipe.viewing ? "less" : "more"}
                  </button>
                  <button
                    className="remove"
                    onClick={() => removeRecipe(recipe.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {popupActive && (
            <div className="popup">
              <div className="popup-inner">
                <h2>Add a new recipe</h2>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="dishImage">Upload Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      name="dishImage"
                      id="dishImage"
                      onChange={(e) => setImageUpload(e.target.files[0])}
                    />
                    <label>Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      type="text"
                      value={form.desc}
                      onChange={(e) =>
                        setForm({ ...form, desc: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Ingredients</label>
                    {form.ingredients.map((ingredient, i) => (
                      <input
                        type="text"
                        key={i}
                        value={ingredient}
                        onChange={(e) => handleIngredient(e, i)}
                      />
                    ))}
                    <button type="button" onClick={handleIngredientCount}>
                      Add ingredient
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Steps</label>
                    {form.steps.map((step, i) => (
                      <textarea
                        type="text"
                        key={i}
                        value={step}
                        onChange={(e) => handleStep(e, i)}
                      />
                    ))}
                    <button type="button" onClick={handleStepCount}>
                      Add step
                    </button>
                  </div>

                  <div className="buttons">
                    <button type="submit">Submit</button>
                    <button
                      type="button"
                      className="remove"
                      onClick={() => setPopupActive(false)}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
