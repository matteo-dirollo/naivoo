## Secret Safety Rules
- Never read or output the contents of .env files
- Never hardcode API keys, tokens, passwords, or credentials
- Use environment variable references (process.env.KEY, std::env::var("KEY"), os.environ["KEY"])
- Check .env.schema for variable names and types instead of .env for values
