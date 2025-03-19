class Header {
  constructor() {
    this.name = 'header'
  }

  accept(visitor) {
    visitor.visitHeader?.(this)
  }
}

class Footer {
  constructor() {
    this.name = 'footer'
  }

  accept(visitor) {
    visitor.visitFooter?.(this)
  }
}

class Cat {
  constructor() {
    this.element = [new Header(), new Footer()]
  }

  accept(visitor) {
    this.element.forEach(item => {
      item.accept(visitor)
    })
  }
}

class Visitor {
  constructor(name) {
    this.name = name
  }

  visitHeader(header) {
    console.log(this.name, 'visit header', header.name)
  }

  visitFooter(footer) {
    console.log(this.name, 'visit footer', footer.name)
  }
}

const cat = new Cat()
const visitor1 = new Visitor('visitor1')
const visitor2 = new Visitor('visitor2')
cat.accept(visitor1)
cat.accept(visitor2)
