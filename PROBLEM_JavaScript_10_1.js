
    (()=>{
    

// ###################
// PROMPT
// ###################
/* Test if gniven strig is a palindrome */
const isPalindrome = (string) => {
  return string == string.split('').reverse().join('');
}

/* Find the shortest palindrome that begins with a supplied string.
  Algorithm idea is simple:
  - Find the longest postfix of supplied string that is a palindrome.
  - Append to the end of the string reverse of a string prefix that comes before the palindromic suffix.
  >>> makePalindrome('')
  ''
  >>> makePalindrome('cat')
  'catac'
  >>> makePalindrome('cata')
  'catac'
  */
const makePalindrome = (string) => {

    

// ###################
// ANSWER
// ###################
  let palindrome = string;
  let i = string.length - 1;
  
  while (i >= 0) {
    if (isPalindrome(string.slice(i))) {
      palindrome += string.slice(0, i).split('').reverse().join('');
      break;
    }
    i--;
  }
  
  return palindrome;
}

console.log(makePalindrome('')); // ''
console.log(makePalindrome('cat')); // 'catac'
console.log(makePalindrome('cata')); // 'catac'
    

// ###################
// TEST
// ###################
const testmakePalindrome = () => {
  console.assert(makePalindrome('') === '')
  console.assert(makePalindrome('x') === 'x')
  console.assert(makePalindrome('xyz') === 'xyzyx')
  console.assert(makePalindrome('xyx') === 'xyx')
  console.assert(makePalindrome('jerry') === 'jerryrrej')
}

testmakePalindrome()

    })()
    