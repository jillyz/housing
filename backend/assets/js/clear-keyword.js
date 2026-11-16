document.querySelectorAll('input[type="search"]').forEach(input => {
  input.addEventListener('input', () => {
    if (input.value === '') input.form?.requestSubmit();
  });
});
