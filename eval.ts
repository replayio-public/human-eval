

/* Create a function that takes 3 numbers. 
Returns true if one of the numbers is equal to the sum of the other two, and all numbers are integers. 
Returns false in any other cases. 
Examples anyInt(5, 2, 7) ➞ true anyInt(3, 2, 2) ➞ false anyInt(3, -2, 1) ➞ true anyInt(3.6, -2.2, 2) ➞ false */


function anyInt(a: number, b: number, c: number): boolean {
  // Check if all numbers are integers
  if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(c)) {
    return false;
  }

  // Check if one number is the sum of the other two
  return (a === b + c) || (b === a + c) || (c === a + b);
}




const testAnyInt = () => {
  console.assert(anyInt(2, 3, 1) === true)
  console.assert(anyInt(2.5, 2, 3) === false)
  console.assert(anyInt(1.5, 5, 3.5) === false)
  console.assert(anyInt(2, 6, 2) === false)
  console.assert(anyInt(4, 2, 2) === true)
  console.assert(anyInt(2.2, 2.2, 2.2) === false)
  console.assert(anyInt(-4, 6, 2) === true)
  console.assert(anyInt(2, 1, 1) === true)
  console.assert(anyInt(3, 4, 7) === true)
  console.assert(anyInt(3.0, 4, 7) === true)
}

testAnyInt()


